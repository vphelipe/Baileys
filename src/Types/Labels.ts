import { ManyToOne, OneToOne } from '../Utils/label-utils'

// from proto
export type Label = {
	predefinedId?: number | null
	name?: string | null
	color?: number | null
	deleted?: boolean | null
}

export type LabelAssocAction = {
	contactName: string
	labelPredefinedId: number
	assign: boolean
}

export type JsonLabels = { [labelId: string]: Label[] }

export type JsonLabelsForContact = { [contactId: string]: number[] }
