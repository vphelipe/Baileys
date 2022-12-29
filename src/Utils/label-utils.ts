export class ManyToOne<K, V> extends Map<K, V[]> {
	appendValueForKey(key: K, value: V, avoidDuplicates: boolean = true): void {
		if (!super.has(key)) {
			super.set(key, [])
		}
		const values = super.get(key)!
		if (avoidDuplicates && values.includes(value)) {
			return
		}
		values.push(value)
	}

	findUniqueKeysWithValue(value: V): K[] {
		const ret: K[] = []
		for (const [k, values] of super.entries()) {
			if (values.includes(value) && !ret.includes(k)) {
				ret.push(k)
			}
		}
		return ret
	}

	transpose(): ManyToOne<V, K> {
		const ret: ManyToOne<V, K> = new ManyToOne()
		for (const [k, values] of super.entries()) {
			for (const value of values) {
				ret.appendValueForKey(value, k)
			}
		}
		return ret
	}

	rightJoin<TLeft, TRight>(
		leftTable: TLeft[],
		getLeftKey: (row: TLeft) => K,
		rightTable: TRight[],
		getRightKey: (row: TRight) => V
	): ManyToOne<TLeft, TRight> {
		const ret: ManyToOne<TLeft, TRight> = new ManyToOne()
		for (const leftRow of leftTable) {
			const leftKey: K = getLeftKey(leftRow)
			const rightKeysFoundInLookup = this.get(leftKey)
			if (!rightKeysFoundInLookup) {
				continue
			}

			const rightRowsResolved: TRight[] = rightTable.filter((rightRow) =>
				rightKeysFoundInLookup.includes(getRightKey(rightRow))
			)
			ret.set(leftRow, rightRowsResolved)
		}

		return ret
	}
}
