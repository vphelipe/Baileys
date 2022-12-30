import { ManyToOne, MapJ as OneToOne } from '../Utils/label-utils'

// from proto
export type Label = {
	predefinedId?: number | null
	name?: string | null
	color?: number | null
}

export type LabelAssocAction = {
	contactName: string
	labelPredefinedId: number
	assign: boolean
}

// will be filled by (.initialSync=true).syncAction.value=labelEditAction
export const labelsById: OneToOne<number, Label> = new OneToOne('labels')

// will be filled by (.initialSync=true).syncAction.value=labelEditAction.predefinedId
export const labelsForContact = new ManyToOne<number, string>(
	'labelsForContact'
) // Map of labelId: contactIds[]

export type JsonLabels = { [labelId: string]: Label[] }

export type JsonLabelsForContact = { [contactId: string]: number[] }
