import * as _ from 'lodash/fp'
import * as jwt from 'jsonwebtoken'
import * as hal from 'hal'
import StatusCode from 'status-code-enum'

import {User} from '../../../..'
import {Roles} from '../../../..'

interface Config {
    jwtPrivateKey: string
}

export class SecurityMiddleware {
    private readonly jwtPrivateKey: string

    constructor(cnfg: Config) {
        const {jwtPrivateKey} = cnfg
        this.jwtPrivateKey = jwtPrivateKey
    }

    public hasRole(role: Roles) {
        const roleCheck = (req, res, next) => {
            const userHasRole = _.compose(_.includes(role), _.getOr([], 'user.roles'))(req)
            if(userHasRole) {
                next()
            } else {
                res.status(StatusCode.ClientErrorForbidden).json(new hal.Resource({}, req.url))
                res.send()
            }
        }
        return [this.getUser(), roleCheck]
    }

    private getUser() {
        return (req, res, next) => {
            jwt.verify(_.get('headers.authorization', req), this.jwtPrivateKey, function (err, decoded) {
                if(err) {
                    console.debug('Cannot get user by authorization header', err)
                    res.status(StatusCode.ClientErrorUnauthorized).json(new hal.Resource({}, req.url))
                    res.send()
                } else {
                    req.user = new User({...decoded.data})
                    next()
                }
            })
        }
    }
}
