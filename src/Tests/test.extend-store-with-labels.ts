import { readFileSync } from 'fs'
import { makeInMemoryStore } from '../Store'
import { BaileysEventEmitter, ChatMutation, Contact } from '../Types'
import { Label } from '../Types/Labels'
import {
	makeEventBuffer,
	BaileysBufferableEventEmitter,
	processSyncAction,
} from '../Utils'
import { OneToOne } from '../Utils/label-utils'
import MAIN_LOGGER from '../Utils/logger'

// jest --config=../../jest.config.js -i test.extend-store-with-labels.ts
// jest --clearCache; jest -i test.extend-store-with-labels.ts --watch

describe('extend-store-with-labels', () => {
	let logger
	let ev: BaileysBufferableEventEmitter
	let store: {
		contacts: {
			[_: string]: Contact
		}
		readFromFile: (path: string) => void
		writeToFile: (path: string) => void
		bind: (ev: BaileysEventEmitter) => void
	}
	let storeContacts: StoreContacts
	let me: Contact

	beforeEach(() => {
		logger = MAIN_LOGGER.child({})
		logger.level = 'trace'
		ev = makeEventBuffer(logger)

		store = makeInMemoryStore({ logger })
		// ev.buffer()
		store.readFromFile('./baileys_store_multi.json')
		// store.readFromFile('./TestData/formatted-baileys_store_multi.json')
		// store.readFromFile('./TestData/baileys_store_multi_withLabels.json')
		// ev.flush()

		console.error('store.contacts::', store.contacts)
		storeContacts = store.contacts

		const meKey = Object.keys(storeContacts)[0]
		me = storeContacts[meKey]
		console.error('me', me)
	})

	xit('eventEmitter(label_edit) invokes subscriber(label.edit)', () => {
		const label: Label = {
			color: 1,
			deleted: false,
			name: 'New customer',
			predefinedId: 1,
		}

		const sampleLabel: ChatMutation = {
			index: ['label_edit', '1'],
			syncAction: {
				// index: 'WyJsYWJlbF9lZGl0IiwiMSJd', // proto is too old; getting these new fields from from WA
				// padding: '',
				value: {
					labelEditAction: label,
					// timestamp: '1672265111508',
				},
				version: 3,
			},
		}

		const labelsById: OneToOne<number, Label> = new OneToOne(
			'labelsById/TEST'
		)

		ev.on('label.edit', (label) =>
			labelsById.putIfAbsent((label) => label.predefinedId || -1, label)
		)

		ev.buffer()

		processSyncAction(sampleLabel, ev, me, undefined, logger)

		ev.flush()

		expect(labelsById.get(1)).toEqual(label)
	})

	xit('load protoActions', () => {
		const protoActions = getSampleProtoActions(false)
		console.log(JSON.stringify(protoActions, null, 2))
	})

	xit('parse protoActions', () => {
		const chatMutations = getSampleProtoActions()
		for (const chatMutation of chatMutations) {
			console.warn(JSON.stringify(chatMutation, null, 2))
		}
	})

	xit('processSyncAction invokes eventEmitter', () => {
		const chatMutations = getSampleProtoActions() as DumpedLogChatMutation[]
		for (const chatMutation of chatMutations) {
			console.warn(JSON.stringify(chatMutation.syncAction, null, 2))
			processSyncAction(
				chatMutation.syncAction,
				ev,
				me,
				undefined,
				logger
			)
			break
		}
	})

	it('processSyncAction inserts', () => {
		const chatMutations = getSampleProtoActions() as DumpedLogChatMutation[]
		store.bind(ev)

		// WRONG!! in-memory-store doesn't get updates
		// FIXME POTENTIAL_ENDLESS_LOOP
		ev.buffer()
		for (const chatMutation of chatMutations) {
			console.warn(JSON.stringify(chatMutation.syncAction, null, 2))
			processSyncAction(
				chatMutation.syncAction,
				ev,
				me,
				undefined,
				logger
			)
		}
		// WRONG!! in-memory-store doesn't get updates
		// FIXME POTENTIAL_ENDLESS_LOOP
		ev.flush()

		store.writeToFile('./TestData/WITH_LABELS_baileys_store_multi.json')
	})
})

type StoreContacts = {
	[_: string]: Contact
}

type DumpedLogRecord = {
	syncAction: ChatMutation
	id: string
	msg: string
}

type DumpedLogChatMutation = {
	initialSync: boolean
	msg: string
	syncAction: ChatMutation
}

function getSampleProtoActions(
	removeLogs: boolean = true
): DumpedLogRecord[] | DumpedLogChatMutation[] {
	const protoActionsJsonStr = readFileSync(
		'./TestData/formatted-first-run-labels-only.json',
		{
			encoding: 'utf-8',
		}
	)
	const protoActions: (DumpedLogRecord | DumpedLogChatMutation)[] =
		JSON.parse(protoActionsJsonStr)
	if (removeLogs == false) {
		return protoActions as DumpedLogRecord[]
	}

	const onlySyncActions = protoActions.filter(
		(syncAction) => !syncAction.hasOwnProperty('id')
	)
	return onlySyncActions as DumpedLogChatMutation[]
}
