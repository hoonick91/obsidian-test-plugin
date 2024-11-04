export class DailyContents {
	contents: DailyContent[] = []

	push(dailyContent: DailyContent) {
		this.contents.push(dailyContent)
	}

	new(): string {
		// Doing -> Done
		this.moveDoingToDone()
		this.moveDoingToTodo()
		// Doing -> Todo

		const doing = this.contents
			.filter(dailyContent => dailyContent.title == 'Doing')
			.first()

		if (doing !== undefined) {
			doing.contents = ""
		}

		// const done = this.createDone()
		// console.log(todo.create())
		// console.log(done)

		let result = ''
		this.contents.forEach((dailyContent) => {
			result += dailyContent.create()
		})
		return result
	}

	private moveDoingToDone() {
		const doing = this.contents
			.filter(dailyContent => dailyContent.title == 'Doing')
			.first()

		const done = this.contents
			.filter(dailyContent => dailyContent.title == 'Done')
			.first()

		if (doing !== undefined && done !== undefined) {
			console.log("doing to done")
			console.log(this.getDoneWithParentsIn(doing))
			done.contents += this.getDoneWithParentsIn(doing)
		}
	}

	getDoneWithParentsIn = (dailyContent: DailyContent | undefined): string => {
		if (dailyContent == undefined) {
			throw new Error('Daily content not found')
		}

		const lines = dailyContent.contents.split('\n')
			.map(line => line.trimEnd())

		const result: string[] = [];
		const parentsStack: string[] = [];
		const parentsChecker: Set<string> = new Set()

		lines.forEach(line => {
			const isChecked = line.includes('- [x]');
			const indentLevel = line.search(/\S|$/);

			// 현재 줄이 상위 계위에 해당하는지 확인
			while (parentsStack.length > 0 && parentsStack[parentsStack.length - 1].search(/\S|$/) >= indentLevel) {
				parentsStack.pop();
			}

			// 체크된 항목을 발견했을 때
			if (isChecked) {
				// 체크된 항목과 상위 항목을 추가
				const parentId = parentsStack.join()
				if (!parentsChecker.has(parentId)) {
					result.push(...parentsStack);
					parentsChecker.add(parentId)
				}
				result.push(line);
			}

			// 현재 항목을 상위 계위로 스택에 추가
			parentsStack.push(line);
		});

		return result.join('\n')
	};

	private moveDoingToTodo() {
		const doing = this.contents
			.filter(dailyContent => dailyContent.title == 'Doing')
			.first()

		const todo = this.contents
			.filter(dailyContent => dailyContent.title == 'Todo')
			.first()

		if (doing !== undefined && todo !== undefined) {
			console.log("doing to todo")
			console.log(this.getTodoWithParentsIn(doing))
			doing.contents += this.getTodoWithParentsIn(doing)
		}

	}

	getTodoWithParentsIn = (dailyContent: DailyContent | undefined): string => {
		if (dailyContent == undefined) {
			throw new Error('Daily content not found')
		}

		const lines = dailyContent.contents.split('\n')
			.map(line => line.trimEnd())

		const result: string[] = [];
		const parentsStack: string[] = [];
		const parentsChecker: Set<string> = new Set()

		lines.forEach(line => {
			const isChecked = line.includes('- [ ]');
			const indentLevel = line.search(/\S|$/);

			// 현재 줄이 상위 계위에 해당하는지 확인
			while (parentsStack.length > 0 && parentsStack[parentsStack.length - 1].search(/\S|$/) >= indentLevel) {
				parentsStack.pop();
			}

			// 체크된 항목을 발견했을 때
			if (isChecked) {
				// 체크된 항목과 상위 항목을 추가
				const parentId = parentsStack.join()
				if (!parentsChecker.has(parentId)) {
					result.push(...parentsStack);
					parentsChecker.add(parentId)
				}
				result.push(line);
			}

			// 현재 항목을 상위 계위로 스택에 추가
			parentsStack.push(line);
		});

		return result.join('\n')
	};


}

export class DailyContent {
	title: string
	public contents: string

	constructor(title: string, contents: string) {
		this.title = title
		this.contents = contents;
	}

	create(): string {
		return `## ${this.title}\n${this.contents}\n`
	}
}
