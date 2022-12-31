export type ObjectKey = string | number // || Symbol

export class OneToOne<K, V> extends Map<K, V> {
	get msig(): string {
		return `OntToOne[${this.whatsInside}]`
	}

	constructor(readonly whatsInside: string, copyFrom?: Map<K, V>) {
		super(copyFrom)
	}

	clone(): OneToOne<K, V> {
		return new OneToOne(`${this.whatsInside}.cloned`, this)
	}

	getIfAbsent(key: K, ifAbsent: V): V {
		const existing = super.get(key)
		return existing || ifAbsent
	}

	putIfAbsent(
		getKey: (value: V) => K,
		newValue: V,
		merge: boolean = false
	): V | undefined {
		const key: K | undefined = getKey(newValue)
		if (!key) {
			console.error(
				`${this.msig}.putIfAbsent() couldn't .getKey() for newValue`,
				[newValue]
			)
			return undefined
		}
		const existing = super.get(key)
		if (existing) {
			const toBePut: V = merge ? { ...existing, ...newValue } : newValue
			super.set(key, toBePut)
			return toBePut
		} else {
			super.set(key, newValue)
			return newValue
		}
	}

	fillFromJsonMap(
		jsonMap: { [_: ObjectKey]: any } | undefined,
		keyFactory?: (_: any) => K,
		valueFactory?: (_: any) => V
	) {
		if (!jsonMap) {
			return
		}
		for (const jsonKey in jsonMap) {
			let keyConverted: K
			try {
				keyConverted =
					keyFactory?.(jsonKey) || (jsonKey as unknown as K)
			} catch (e) {
				console.error(`${this.msig} keyFactory(${jsonKey}) SKIPPED`, [
					e,
					jsonKey,
				])
				continue
			}

			const value = jsonMap[jsonKey]
			let valueConverted: V
			try {
				valueConverted =
					valueFactory?.(value) || (value as unknown as V)
			} catch (e) {
				console.error(`${this.msig} valueFactory(${value}) SKIPPED`, [
					e,
					value,
				])
				continue
			}

			this.set(keyConverted, valueConverted)
		}
	}

	dumptoJson(
		keyConverter?: (_: K) => ObjectKey,
		valueConverter?: (_: V) => ObjectKey
	): { [_: ObjectKey]: ObjectKey } {
		const ret: { [_: ObjectKey]: ObjectKey } = {}
		for (const tuple of this.entries()) {
			const [mapKey, mapValue] = tuple
			const keyConverted: ObjectKey =
				keyConverter?.(mapKey) || (mapKey as unknown as ObjectKey)
			const valueConverted: ObjectKey =
				valueConverter?.(mapValue) || (mapValue as unknown as ObjectKey)
			ret[keyConverted] = valueConverted
		}
		return ret
	}
}

export class ManyToOne<K, V> extends Map<K, V[]> {
	constructor(readonly whatsInside: string, copyFrom?: Map<K, V[]>) {
		super(copyFrom)
	}

	clone(): ManyToOne<K, V> {
		return new ManyToOne(`${this.whatsInside}.cloned`, this)
	}

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

	removeValueForKey(
		key: K,
		value: V,
		removeKeyIfEmpty: boolean = false
	): void {
		if (!super.has(key)) {
			return
		}
		const values = super.get(key)!
		const indexFound = values.indexOf(value)
		if (indexFound === -1) {
			return
		}
		const shallowCopy = values.splice(indexFound, 1)
		if (shallowCopy.length === 0 && removeKeyIfEmpty) {
			super.delete(key)
			return
		}
		super.set(key, shallowCopy)
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
		const ret: ManyToOne<V, K> = new ManyToOne(
			`${this.whatsInside}.transposed`
		)
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
		const ret: ManyToOne<TLeft, TRight> = new ManyToOne(
			`${this.whatsInside}.rightJoined`
		)
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

	fillFromJsonMap(
		jsonMap: { [_: ObjectKey]: ObjectKey[] } | undefined,
		keyFactory?: (_: any) => K,
		valueFactory?: (_: any) => V
	) {
		if (!jsonMap) {
			return
		}
		const msig = `ManyToOne[${this.whatsInside}]`
		for (const jsonKey in jsonMap) {
			let keyConverted: K
			try {
				keyConverted =
					keyFactory?.(jsonKey) || (jsonKey as unknown as K)
			} catch (e) {
				console.error(`${msig} keyFactory(${jsonKey}) SKIPPED`, [
					e,
					jsonKey,
				])
				continue
			}

			const values = jsonMap[jsonKey]
			for (const value of values) {
				let valueConverted: V
				try {
					valueConverted =
						valueFactory?.(value) || (value as unknown as V)
				} catch (e) {
					console.error(`${msig} valueFactory(${value}) SKIPPED`, [
						e,
						value,
					])
					continue
				}

				this.appendValueForKey(keyConverted, valueConverted)
			}
		}
	}

	dumptoJson(
		keyConverter?: (_: K) => ObjectKey,
		valueConverter?: (_: V) => ObjectKey
	): { [_: ObjectKey]: ObjectKey[] } {
		const ret: { [_: ObjectKey]: ObjectKey[] } = {}
		for (const tuple of this.entries()) {
			const [mapKey, mapValues] = tuple
			const keyConverted: ObjectKey =
				keyConverter?.(mapKey) || (mapKey as unknown as ObjectKey)
			const valuesConverted: ObjectKey[] = mapValues.map(
				(value) =>
					valueConverter?.(value) || (value as unknown as ObjectKey)
			)
			ret[keyConverted] = valuesConverted
		}
		return ret
	}
}
