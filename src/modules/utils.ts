import dotenv from 'dotenv';
import cache, {type AccessTokensKey} from './cache.js';
import {providerInfluenceth} from './providers/provider-influenceth.js';

dotenv.config();

/**
 * Get access token for "provider", and initialize "cache.accessTokens[provider]" if not set
 */
async function loadAccessToken(provider: AccessTokensKey): Promise<string|null> {
    // console.log(`--- [loadAccessToken('${provider}')]`); //// TEST
    if (cache.accessTokens[provider]) {
        // console.log(`--- [loadAccessToken('${provider}')] found CACHED token`); //// TEST
        return cache.accessTokens[provider];
    }
    let token: string|null;
    switch (provider) {
        case 'influenceth':
            try {
                const clientId = process.env.INFLUENCETH_IO_API_ID as string;
                const clientKey = process.env.INFLUENCETH_IO_API_KEY as string;
                token = await providerInfluenceth.fetchAccessToken(clientId, clientKey);
            } catch (error: any) {
                console.log(`--- [loadAccessToken('${provider}')] ERROR:`, error); //// TEST
                return null;
            }
            break;
        // Add more providers here
        default:
            return null;
    }
    cache.accessTokens[provider] = token;
    // console.log(`--- [loadAccessToken('${provider}')] SET token ${token?.replace(/^(.{4}).+(.{4})$/, '$1...$2')}`); //// HIDE in prod
    return token;
}

/**
 * Given a (nested) object, or array of (nested) objects,
 * recursively remove all properties having any key from "keys".
 */
function removeProps(obj: any, keys: string[]): void {
    if (Array.isArray(obj)) {
        obj.forEach(item => {
            removeProps(item, keys);
        });
    } else if (typeof obj === 'object' && obj != null) {
        Object.getOwnPropertyNames(obj).forEach(key => {
            if (keys.indexOf(key) !== -1) {
                delete obj[key];
            } else {
                removeProps(obj[key], keys);
            }
        });
    }
}

export default {
    loadAccessToken,
    removeProps,
}
