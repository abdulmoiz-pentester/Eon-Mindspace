import * as saml2 from 'saml2-js';

export class SAMLService {
  private sp: any;
  private idp: any;
  
  constructor() {
    // Use any type to avoid TypeScript errors
    const spOptions = {
      entity_id: process.env.SAML_ENTITY_ID || process.env.SAML_ISSUER || 'http://localhost:5000',
      private_key: process.env.SAML_PRIVATE_KEY || '',
      certificate: process.env.SAML_PUBLIC_CERT || '',
      assert_endpoint: process.env.SAML_CALLBACK_URL || 'http://localhost:5000/auth/saml/callback'
    };
    
    const idpOptions = {
      sso_login_url: process.env.SAML_ENTRY_POINT || '',
      sso_logout_url: '',
      certificates: [process.env.SAML_IDP_CERT || ''],
      force_authn: false,
      sign_get_request: false
    };
    
    this.sp = new saml2.ServiceProvider(spOptions);
    this.idp = new saml2.IdentityProvider(idpOptions);
  }
  
  async generateLoginUrl(relayState: string = '/'): Promise<string> {
    return new Promise((resolve, reject) => {
      this.sp.create_login_request_url(
        this.idp,
        {
          relay_state: relayState
        },
        (err: any, loginUrl: string) => {
          if (err) {
            reject(err);
          } else {
            resolve(loginUrl);
          }
        }
      );
    });
  }
  
  async processResponse(samlResponse: string, relayState?: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const options = {
        request_body: {
          SAMLResponse: samlResponse,
          RelayState: relayState
        }
      };
      
      this.sp.post_assert(this.idp, options, (err: any, samlUser: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(samlUser);
        }
      });
    });
  }
  
  generateMetadata(): string {
    return this.sp.create_metadata();
  }
}