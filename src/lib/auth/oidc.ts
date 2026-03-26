import {
  authorizationCodeGrant,
  buildAuthorizationUrl as oidcBuildAuthorizationUrl,
  buildEndSessionUrl as oidcBuildEndSessionUrl,
  calculatePKCECodeChallenge,
  discovery,
  randomNonce,
  randomPKCECodeVerifier,
  randomState,
  refreshTokenGrant,
  type Configuration,
} from "openid-client";
import { env } from "@/lib/env";

type AuthorizationOptions = {
  state: string;
  codeChallenge: string;
  nonce: string;
  prompt?: string;
};

type CallbackOptions = {
  url: URL;
  state: string;
  nonce: string;
  codeVerifier: string;
};

type TokenResponse = Awaited<ReturnType<typeof authorizationCodeGrant>>;

let configurationPromise: Promise<Configuration> | null = null;

async function resolveConfiguration(): Promise<Configuration> {
  if (!configurationPromise) {
    configurationPromise = (async () => {
      const issuer = new URL(env.OIDC_ISSUER);
      return discovery(
        issuer,
        env.OIDC_CLIENT_ID,
        {
          client_secret: env.OIDC_CLIENT_SECRET,
          redirect_uris: [env.OIDC_REDIRECT_URI],
          response_types: ["code"],
          post_logout_redirect_uris: [env.OIDC_POST_LOGOUT_REDIRECT_URI],
        },
      );
    })();
  }
  return configurationPromise;
}

export async function generateState(): Promise<string> {
  return randomState();
}

export async function generateNonce(): Promise<string> {
  return randomNonce();
}

export async function generateCodeVerifier(): Promise<{ verifier: string; challenge: string }> {
  const verifier = randomPKCECodeVerifier();
  const challenge = await calculatePKCECodeChallenge(verifier);
  return { verifier, challenge };
}

export async function buildAuthorizationUrl({
  codeChallenge,
  nonce,
  state,
  prompt,
}: AuthorizationOptions): Promise<string> {
  const config = await resolveConfiguration();
  const params: Record<string, string | undefined> = {
    scope: "openid profile email",
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    state,
    nonce,
    redirect_uri: env.OIDC_REDIRECT_URI,
  };

  if (env.OIDC_AUDIENCE) {
    params.audience = env.OIDC_AUDIENCE;
  }
  if (prompt) {
    params.prompt = prompt;
  }

  return oidcBuildAuthorizationUrl(config, params).toString();
}

export async function handleCallback({
  url,
  codeVerifier,
  state,
  nonce,
}: CallbackOptions): Promise<TokenResponse> {
  const config = await resolveConfiguration();
  return authorizationCodeGrant(
    config,
    url,
    {
      pkceCodeVerifier: codeVerifier,
      expectedState: state,
      expectedNonce: nonce,
      idTokenExpected: true,
    },
  );
}

export async function getEndSessionUrl(idTokenHint?: string, postLogoutRedirectUri?: string): Promise<string | null> {
  const config = await resolveConfiguration();
  const url = oidcBuildEndSessionUrl(config, {
    id_token_hint: idTokenHint,
    post_logout_redirect_uri: postLogoutRedirectUri ?? env.OIDC_POST_LOGOUT_REDIRECT_URI,
  });
  return url?.toString() ?? null;
}

export async function refreshTokens(refreshToken: string): Promise<TokenResponse> {
  const config = await resolveConfiguration();
  return refreshTokenGrant(config, refreshToken);
}
