import * as saml2 from 'saml2-js';

export class SAMLService {
  private sp: any;
  private idp: any;

  constructor() {
    // Service Provider (your app) - no keys needed for dev/testing
    const spOptions = {
      entity_id: process.env.SAML_ENTITY_ID || 'http://localhost:5000',
      assert_endpoint: process.env.SAML_CALLBACK_URL || 'http://localhost:5000/auth/saml/callback',
      allow_unencrypted_assertion: true, // important for testing
      private_key: process.env.SAML_PRIVATE_KEY || '',
      certificate: process.env.SAML_CERTIFICATE || ''
    };
    console.log('📌 SP Options:', spOptions);

    // Identity Provider (Keycloak)
    const idpOptions = {
      sso_login_url: process.env.SAML_ENTRY_POINT || 'http://localhost:8081/realms/EON-Security/protocol/saml',
      sso_logout_url: '',
      certificates: [(process.env.SAML_IDP_CERT || '').replace(/\\n/g, '\n')],
      force_authn: false,
      sign_get_request: false
    };
    console.log('📌 IDP Options:', idpOptions);

    this.sp = new saml2.ServiceProvider(spOptions as any);
    this.idp = new saml2.IdentityProvider(idpOptions);
  }

  // Generate login form (POST binding)
  async generateLoginForm(relayState: string = '/'): Promise<string> {
    return new Promise((resolve, reject) => {
      this.sp.create_login_request_url(
        this.idp,
        { relay_state: relayState, binding: 'post' },
        (err: any, loginUrl: string, requestBody: any) => {
          if (err) return reject(err);

          console.log('✅ SAMLRequest generated successfully');
          console.log('SAMLRequest (first 100 chars):', requestBody.SAMLRequest?.substring(0, 100));
          console.log('RelayState:', relayState);
          console.log('🔹 IDP URL:', this.idp.sso_login_url);

          const formHtml = `
            <form method="POST" action="${this.idp.sso_login_url}">
              <input type="hidden" name="SAMLRequest" value="${requestBody.SAMLRequest}" />
              <input type="hidden" name="RelayState" value="${relayState}" />
            </form>
            <script>document.forms[0].submit();</script>
          `;
          resolve(formHtml);
        }
      );
    });
  }

  // Process SAML response from IdP
  async processResponse(samlResponse: string, relayState?: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const options = {
        request_body: {
          SAMLResponse: samlResponse,
          RelayState: relayState
        }
      };

      this.sp.post_assert(this.idp, options, (err: any, samlUser: any) => {
        if (err) reject(err);
        else resolve(samlUser);
      });
    });
  }

  // Generate SP metadata
  generateMetadata(): string {
    return this.sp.create_metadata();
  }
}
