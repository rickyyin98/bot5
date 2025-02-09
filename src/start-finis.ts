import { finis }    from 'finis'
import { Wechaty }  from 'wechaty'

import {
  chatops,
}             from './chatops'
import {
  crontab,
}             from './plugins'
import {
  log,
  VERSION,
}             from './config'

const BOT_NAME = 'BOT5'

const LOGIN_ANNOUNCEMENT  = `Der! I just got online!\n${BOT_NAME} v${VERSION}`
// const LOGOUT_ANNOUNCEMENT = `Der! I'm going to offline now, see you, bye!\BOT5 v${VERSION}`
const EXIT_ANNOUNCEMENT   = `Der! I'm going to exit now, see you, bye!\n${BOT_NAME} v${VERSION}`

let bot: undefined | Wechaty

export async function startFinis (wechaty: Wechaty): Promise<void> {
  if (bot) {
    throw new Error('startFinis should only init once')
  }
  bot = wechaty

  bot.on('login',   _ => chatops(wechaty, LOGIN_ANNOUNCEMENT))
  bot.on('logout',  user => log.info('RestartReporter', 'startFinis() bot %s logout', user))
  await crontab(bot)
}

/**
 *
 * SIGTERM
 *
 */
let FINIS_QUITING = false

finis(async (code, signal) => {
  if (!bot) {
    log.warn('RestartReporter', 'finis() no bot set, NOOP')
    return
  }

  if (FINIS_QUITING) {
    log.warn('RestartReporter', 'finis(%s, %s) called again when quiting... NOP', code, signal)
    return
  }

  FINIS_QUITING = true
  log.info('RestartReporter', 'finis(%s, %s)', code, signal)

  if (bot.logonoff()) {
    log.info('RestartReporter', 'finis() announce exiting')
    try {
      // log.level('silly')
      await chatops(bot, EXIT_ANNOUNCEMENT)
      log.info('startFinis', 'finis() chatops() done')
      await bot.say(EXIT_ANNOUNCEMENT)
      log.info('startFinis', 'finis() bot.say() done')
      await new Promise(resolve => setTimeout(resolve, 10 * 1000))
      log.info('startFinis', 'finis() sleep 10s done')
    } catch (e) {
      log.error('RestartReporter', 'finis() exception: %s', e)
    }
  } else {
    log.info('RestartReporter', 'finis() bot had been logout-ed')
  }

  setTimeout(() => {
    log.info('RestartReporter', 'finis() hard exit')
    setImmediate(() => process.exit(code))
  }, 10 * 1000)
  log.info('RestartReporter', 'finis() setTimeoutprocess.exit(), 10 * 1000)')

  try {
    log.info('RestartReporter', 'finis() setTimeout() going to exit with %d', code)
    if (bot) {
      await bot.stop()
    }
  } catch (e) {
    log.error('RestartReporter', 'finis() setTimeout() exception: %s', e)
  } finally {
    log.info('RestartReporter', 'finis() soft exit')
    setImmediate(() => process.exit(code))
  }
})
