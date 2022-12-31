export interface Label {
    id: string
    name: string
    colorIndex: number
    predefinedId: number | undefined

}

export interface LabelAssociation {
    id: string
    labelId: string
    associatioinId: string
    type: string
}
