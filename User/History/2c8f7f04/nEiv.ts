import { ServiceProvider, IdentityProvider } from 'saml2-js';
import { getAWSSSOConfig, allowedDomains } from '../config/aws.sso.config';

export interface UserInfo {
  email: string;
  name: string;
  firstName: string;
  lastName: string;
  company: string;
  groups: string[];
  samlSessionIndex: string;
  domain: string;
}

export class SAMLService {
  private sp: ServiceProvider;
  private idp: IdentityProvider;
  
  constructor() {
    const config = getAWSSSOConfig();
    
    // Configure Service Provider (Your App)
    const spConfig = {
      entity_id: config.app.entityId,
      private_key: config.app.privateKey,
      certificate: config.app.certificate,
      assert_endpoint: config.sso.callbackUrl
    };
    
    // Configure Identity Provider (AWS SSO)
    const idpConfig = {
      sso_login_url: config.sso.entryPoint,
      sso_logout_url: `${config.sso.entryPoint}/saml/logout`,
      certificates: [config.sso.cert],
      entity_id: config.sso.issuer
    };
    
    this.sp = new ServiceProvider(spConfig);
    this.idp = new IdentityProvider(idpConfig);
  }
  
  /**
   * Generate SAML login request URL
   */
  async generateLoginRequest(relayState: string = '/'): Promise<string> {
    return new Promise((resolve, reject) => {
      this.sp.create_login_request_url(
        this.idp,
        {
          relay_state: relayState,
          authn_context: {
            comparison: 'exact',
            class_refs: ['urn:oasis:names:tc:SAML:2.0:ac:classes:PasswordProtectedTransport']
          }
        },
        (err: any, loginUrl: string) => {
          if (err) {
            console.error('Error generating SAML login URL:', err);
            reject(new Error('Failed to generate SAML login request'));
          } else {
            resolve(loginUrl);
          }
        }
      );
    });
  }
  
  /**
   * Process SAML response from AWS SSO
   */
  async processResponse(samlResponse: string): Promise<UserInfo> {
    return new Promise((resolve, reject) => {
      const options = {
        request_body: {
          SAMLResponse: samlResponse
        }
      };
      
      this.sp.post_assert(this.idp, options, (err: any, samlUser: any) => {
        if (err) {
          console.error('SAML validation error:', err);
          reject(new Error('Invalid SAML response'));
          return;
        }
        
        try {
          const userInfo = this.extractUserInfo(samlUser);
          
          // Validate company domain
          if (!this.validateDomain(userInfo.domain)) {
            reject(new Error(`Domain ${userInfo.domain} not allowed`));
            return;
          }
          
          resolve(userInfo);
        } catch (error) {
          reject(new Error('Failed to extract user information'));
        }
      });
    });
  }
  
  /**
   * Extract user information from SAML response
   */
  private extractUserInfo(samlUser: any): UserInfo {
    const attributes = samlUser.user.attributes || {};
    
    // AWS SSO typically provides these attributes
    const email = attributes.email || 
                  attributes.mail || 
                  samlUser.user.name_id;
    
    const name = attributes.name || 
                 attributes.displayName || 
                 `${attributes.firstName || ''} ${attributes.lastName || ''}`.trim() ||
                 email.split('@')[0];
    
    const domain = email.split('@')[1];
    
    // Extract groups if provided (AWS SSO can send groups)
    let groups: string[] = [];
    if (attributes.groups) {
      groups = Array.isArray(attributes.groups) ? attributes.groups : [attributes.groups];
    }
    
    return {
      email,
      name,
      firstName: attributes.firstName || name.split(' ')[0],
      lastName: attributes.lastName || name.split(' ').slice(1).join(' ') || '',
      company: this.extractCompanyName(domain),
      groups,
      samlSessionIndex: samlUser.user.session_index,
      domain
    };
  }
  
  /**
   * Validate user's email domain
   */
  private validateDomain(domain: string): boolean {
    return allowedDomains.some(allowed => 
      domain === allowed || domain.endsWith(`.${allowed}`)
    );
  }
  
  /**
   * Extract company name from domain
   */
  private extractCompanyName(domain: string): string {
    const parts = domain.split('.');
    if (parts.length >= 2) {
      // Remove TLD and subdomains
      return parts[parts.length - 2].charAt(0).toUpperCase() + 
             parts[parts.length - 2].slice(1);
    }
    return domain;
  }
  
  /**
   * Generate SP metadata for AWS SSO configuration
   */
  generateMetadata(): string {
    return this.sp.create_metadata();
  }
}