export type ServiceErrorCode = "UNKNOWN_ERROR" | "INVALID_BODY" | "NO_SUCH_DOMAIN" | "TOO_SHORT" | "TOO_LONG" | "REGEX" | "DISALLOWED" | "REGISTERED" | "NOT_AVAILABLE" | "RATE_LIMITED" | "NO_TOKEN" | "INVALID_TOKEN" | "NO_SUCH_PAYMENT";

export interface ServiceError {
    error: ServiceErrorCode
};

export interface ServiceConfig {
    domains: DomainConfig[]
}

export type DomainConfig = {
    name: string,
    default: boolean,
    length: [number, number],
    regex: [string, string],
    regexChars: [string, string]
}

export type HandleAvailability = {
    available: boolean,
    why?: ServiceErrorCode,
    reasonTag?: string | null,
    quote?: HandleQuote
}

export type HandleQuote = {
    price: number,
    data: HandleData
}

export type HandleData = {
    type: string | "premium" | "short"
}

export type HandleRegisterResponse = {
    quote: HandleQuote,
    paymentHash: string,
    invoice: string,
    token: string
}

export type CheckRegisterResponse = {
    available: boolean,
    paid: boolean,
    password: string
}

export class ServiceProvider {
    readonly url: URL | string

    constructor(url: URL | string) {
        this.url = url;
    }

    async GetConfig(): Promise<ServiceConfig | ServiceError> {
        return await this._GetJson("/config.json");
    }

    async CheckAvailable(handle: string, domain: string): Promise<HandleAvailability | ServiceError> {
        return await this._GetJson("/registration/availability", "POST", { name: handle, domain });
    }

    async RegisterHandle(handle: string, domain: string, pubkey: string): Promise<HandleRegisterResponse | ServiceError> {
        return await this._GetJson("/registration/register", "PUT", { name: handle, domain, pk: pubkey, ref: "snort" });
    }

    async CheckRegistration(token: string): Promise<CheckRegisterResponse | ServiceError> {
        return await this._GetJson("/registration/register/check", "POST", undefined, {
            authorization: token
        });
    }
    async _GetJson<T>(path: string, method?: "GET" | string, body?: any, headers?: any): Promise<T | ServiceError> {
        try {
            let rsp = await fetch(`${this.url}${path}`, {
                method: method,
                body: body ? JSON.stringify(body) : undefined,
                headers: {
                    accept: "application/json",
                    ...(body ? { "content-type": "application/json" } : {}),
                    ...headers
                }
            });

            if (rsp.ok) {
                let obj = await rsp.json();
                if ('error' in obj) {
                    return <ServiceError>obj;
                }
                return obj;
            }
        } catch (e) {
            console.warn(e);
        }
        return { error: "UNKNOWN_ERROR" };
    }
}