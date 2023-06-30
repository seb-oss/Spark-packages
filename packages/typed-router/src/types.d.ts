type AuthenticatedUser = {
  identity: string
  token: string
}

// Use declaration merging to add types to Express' Request object
// https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/express-serve-static-core/index.d.ts#L18-L19
declare namespace Express {
  export interface Request {
    user: AuthenticatedUser
    token: string
  }
}
