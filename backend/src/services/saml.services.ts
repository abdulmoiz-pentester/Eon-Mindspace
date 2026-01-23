import { ServiceProvider, IdentityProvider } from 'saml2-js';

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
    // Configure Service Provider (Your App)
    const spConfig = {
      entity_id: process.env.APP_ENTITY_ID || 'http://localhost:5000/auth/sso/metadata',
      private_key: process.env.SAML_PRIVATE_KEY || '',
      certificate: process.env.SAML_CERTIFICATE || '',
      assert_endpoint: process.env.AWS_SSO_CALLBACK_URL || 'http://localhost:5000/auth/sso/acs'
    };
    
    // Configure Identity Provider (AWS SSO)
    const idpConfig = {
      sso_login_url: process.env.AWS_SSO_ENTRY_POINT || '',
      sso_logout_url: '',
      certificates: [process.env.AWS_SSO_CERTIFICATE || ''],
      entity_id: process.env.AWS_SSO_ISSUER || ''
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
          // CORRECT: Only use valid options
          force_authn: true,
          // REMOVE authn_context - it's not a valid option in saml2-js
        },
        (err: any, loginUrl: string) => {
          if (err) {
            console.error('Error generating SAML login URL:', err);
            reject(new Error('Failed to generate SAML login request'));
          } else {
            console.log('Generated SAML login URL');
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
        },
        ignore_signature: process.env.NODE_ENV === 'development',
        allow_unencrypted_assertion: true
      };
      
      this.sp.post_assert(this.idp, options, (err: any, samlUser: any) => {
        if (err) {
          console.error('SAML validation error:', err);
          reject(new Error(`Invalid SAML response: ${err.message}`));
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
          console.error('Error extracting user info:', error);
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
    
    console.log('SAML Attributes:', attributes);
    
    // AWS SSO typically provides these attributes
    const email = attributes.email || 
                  attributes.mail || 
                  attributes['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] ||
                  samlUser.user.name_id;
    
    const name = attributes.name || 
                 attributes.displayName || 
                 attributes['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] ||
                 `${attributes.firstName || ''} ${attributes.lastName || ''}`.trim() ||
                 email.split('@')[0];
    
    const domain = email.split('@')[1] || 'company.com';
    
    // Extract groups if provided
    let groups: string[] = [];
    if (attributes.groups) {
      groups = Array.isArray(attributes.groups) ? attributes.groups : [attributes.groups];
    } else if (attributes['http://schemas.xmlsoap.org/claims/Group']) {
      groups = Array.isArray(attributes['http://schemas.xmlsoap.org/claims/Group']) 
        ? attributes['http://schemas.xmlsoap.org/claims/Group']
        : [attributes['http://schemas.xmlsoap.org/claims/Group']];
    }
    
    return {
      email,
      name,
      firstName: attributes.firstName || name.split(' ')[0],
      lastName: attributes.lastName || name.split(' ').slice(1).join(' ') || '',
      company: this.extractCompanyName(domain),
      groups,
      samlSessionIndex: samlUser.user.session_index || '',
      domain
    };
  }
  
  /**
   * Validate user's email domain
   */
  private validateDomain(domain: string): boolean {
    const allowedDomains = process.env.ALLOWED_DOMAINS?.split(',') || ['eonhealth.com'];
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