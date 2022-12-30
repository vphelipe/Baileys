import { readFileSync } from 'fs'
import { makeInMemoryStore } from '../Store'
import MAIN_LOGGER from '../Utils/logger'

// jest --config=../../jest.config.js -i test.extend-store-with-labels.ts
// jest -i test.extend-store-with-labels.ts --watch

describe('extend-store-with-labels', () => {
	beforeEach(() => {
		const logger = MAIN_LOGGER.child({})
		const store = makeInMemoryStore({ logger })
		store.readFromFile('../../baileys_store_multi.json')

		console.log('store.contacts', store.contacts)
	})

	xit('load protoActions', () => {
		const protoActionsJsonStr = readFileSync(
			'../../TestData/formatted-first-run-labels-only.json',
			{
				encoding: 'utf-8',
			}
		)
		const protoActions = JSON.parse(protoActionsJsonStr)
		console.log(JSON.stringify(protoActions, null, 2))
	})

	it('parse protoActions', () => {
		const protoActionsJsonStr = readFileSync(
			'../../TestData/formatted-first-run-labels-only.json',
			{
				encoding: 'utf-8',
			}
		)
		const protoActions = JSON.parse(protoActionsJsonStr)
		console.log(JSON.stringify(protoActions, null, 2))
	})
})
