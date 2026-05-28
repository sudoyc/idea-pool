import type { NextFunction, Request, Response } from 'express'

export const requireToken = (request: Request, response: Response, next: NextFunction) => {
  const expected = process.env.IDEA_POOL_TOKEN
  if (!expected) {
    next()
    return
  }

  const header = request.header('authorization') ?? ''
  const token = header.startsWith('Bearer ') ? header.slice('Bearer '.length) : ''

  if (token !== expected) {
    response.status(401).json({ error: 'Unauthorized' })
    return
  }

  next()
}
