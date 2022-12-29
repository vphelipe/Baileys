import { ManyToOne } from '../Utils/label-utils'

// from proto
export type Label = {
	name?: string | null
	color?: number | null
	predefinedId?: number | null
}

// will be filled by (.initialSync=true).syncAction.value=labelEditAction
export const labels: Label[] = []

// will be filled by (.initialSync=true).syncAction.value=labelEditAction.predefinedId
export const labelsForContact = new ManyToOne<number, string>()
