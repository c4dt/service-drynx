import assert from 'assert'
import { Component, OnInit, Input, Inject } from '@angular/core'
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material'

import { Data, StorageDB } from '@c4dt/dynacred'
import { ByzCoinRPC, InstanceID } from '@dedis/cothority/byzcoin'
import { IdentityWrapper, Darc } from '@dedis/cothority/darc'
import { WebSocketConnection } from '@dedis/cothority/network/connection'

import { ConfigService } from '../config.service'

@Component({
  selector: 'app-omniledger-login',
  template: '' // empty as only dialog
})
export class OmniledgerLoginComponent implements OnInit {
  // TODO InstanceID?
  @Input() darc: Buffer | undefined

  constructor (
    private readonly dialog: MatDialog
  ) {}

  private async getDarc (): Promise<InstanceID> {
    while (this.darc === undefined) {
      await new Promise(resolve => setTimeout(resolve, 0))
    }

    return this.darc
  }

  ngOnInit (): void {
    this.dialog.open(OmniledgerLoginDialog, {
      disableClose: true,
      data: {
        darc: this.getDarc()
      }
    })
  }
}

@Component({
  templateUrl: './omniledger-login.component.html'
})
export class OmniledgerLoginDialog implements OnInit {
  state: 'loading' | 'not-authorized' | 'authorized'

  constructor (
    readonly dialogRef: MatDialogRef<OmniledgerLoginDialog>,
    private readonly config: ConfigService,
    @Inject(MAT_DIALOG_DATA) readonly data: {darc: Promise<InstanceID>}
  ) {
    this.state = 'loading'
  }

  async ngOnInit (): Promise<void> {
    try {
      this.state = await this.userIsAuthorized() ? 'authorized' : 'not-authorized'
      this.dialogRef.close()
    } catch (e) {
      this.state = 'not-authorized'
      throw e
    }
  }

  private async userIsAuthorized (): Promise<boolean> {
    let byzcoinUrl = this.config.ByzCoin.URL.href
    assert(byzcoinUrl.endsWith('/')) // TODO use URL directly
    byzcoinUrl = byzcoinUrl.slice(0, byzcoinUrl.length - 1)

    const conn = new WebSocketConnection(byzcoinUrl, ByzCoinRPC.serviceName)
    const rpc = await ByzCoinRPC.fromByzcoin(conn, this.config.ByzCoin.ID)
    const data = await Data.load(rpc, StorageDB, undefined, false)
    const identity = IdentityWrapper.fromIdentity(data.keyIdentitySigner)

    const darc = await this.data.darc

    const auths = await rpc.checkAuthorization(this.config.ByzCoin.ID, darc, identity as any)
    return auths.includes(Darc.ruleSign)
  }
}
