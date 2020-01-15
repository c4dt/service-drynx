import { Injectable } from '@angular/core'

import { Client } from '@c4dt/drynx'

import { ConfigService } from './config.service'

@Injectable({
  providedIn: 'root'
})
export class ClientService extends Client {
  constructor (
    config: ConfigService
  ) {
    super(config.ClientURL)
  }
}
