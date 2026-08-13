export interface ExtendedAuthUser {
    username?: string;
    userId?: string;
    signInDetails?: {
        authFlowType?: string;
        attributes?: {
            'custom:role'?: string;
            [key: string]: string | undefined;
        };
    };
}
