export class DailyContents {
	outstanding: DailyContent
	backlog: DailyContent
	todo: DailyContent
	doing: DailyContent
	done: DailyContent
	question: DailyContent

	push(dailyContent: DailyContent) {
		switch (dailyContent.title) {
			case "Outstanding":
				this.outstanding = dailyContent
				break
			case "Backlog":
				this.backlog = dailyContent
				break
			case "Todo":
				this.todo = dailyContent
				break
			case "Doing":
				this.doing = dailyContent
				break
			case "Done":
				this.done = dailyContent
				break
			case "Question":
				this.question = dailyContent
				break
			default:
				break
		}
	}

	now(): string {
		return this.outstanding.create() + this.question.create() + this.backlog.create() + this.todo.create() + this.doing.create() + this.done.create()
	}

	new(): string {
		this.moveDoingToDone()
		this.moveDoingToTodo()
		this.clearDoing()

		this.moveTodoToBacklog()

		return this.outstanding.create() + this.question.create() + this.backlog.create() + this.todo.create() + this.doing.create() + this.done.create()
	}

	private moveDoingToDone() {
		console.log(`dailyContents before => doing: ${this.doing.create()}`)
		console.log(`dailyContents before => done: ${this.done.create()}`)

		const doneFromDoing = this.doing.tasks.getCheckedTasks()
		this.done.add(doneFromDoing)

		this.doing.tasks = this.doing.tasks.getUnCheckedTasks()

		console.log(`dailyContents after => doing: ${this.doing.create()}`)
		console.log(`dailyContents after => done: ${this.done.create()}`)
	}

	private moveDoingToTodo() {
		console.log(`dailyContents before => doing: ${this.doing.create()}`)
		console.log(`dailyContents before => todo: ${this.todo.create()}`)

		const todoFromDoing = this.doing.tasks
			.getUnCheckedTasks()
			.addEmoji('⭐')
		this.todo.add(todoFromDoing)

		this.doing.tasks = this.doing.tasks.getCheckedTasks()

		console.log(`dailyContents after => doing: ${this.doing.create()}`)
		console.log(`dailyContents after => todo: ${this.todo.create()}`)
	}

	private clearDoing() {
		this.doing.tasks = new Tasks(this.doing.title, [new Task('- [ ] ', false)])
	}

	private moveTodoToBacklog() {
		console.log(`dailyContents before => todo: ${this.todo.create()}`)
		console.log(`dailyContents before => backlog: ${this.backlog.create()}`)

		const backlogFromTodo = this.todo.tasks.getCheckedTasks().splitFirst('✅')
		this.backlog.add(backlogFromTodo)
		this.todo.tasks = this.todo.tasks.getUnCheckedTasks()

		console.log(`dailyContents after => todo: ${this.todo.create()}`)
		console.log(`dailyContents after => backlog: ${this.backlog.create()}`)
	}
}

export class DailyContent {
	title: string
	tasks: Tasks

	constructor(title: string, contents: string) {
		this.title = title
		console.log(`DailyContent \ntitle:${title}, \ncontents: \n${contents}`)
		this.tasks = new Tasks(contents)
	}

	create(): string {
		console.log(`DailyContent create:\n ## ${this.title}\n${this.tasks.contents.map(content => content.convertToString()).join('\n')}\n`)
		return `## ${this.title}\n${this.tasks.contents.map(content => content.convertToString()).join('\n')}\n`
	}

	add(tasks: Tasks) {
		this.tasks.add(tasks)
	}
}

export class Tasks {
	contents: Task[]

	constructor(contents?: string, tasks?: Task[]) {
		if (tasks !== undefined) {
			this.contents = tasks
			return
		}

		if (contents !== undefined) {
			const newTasks: Task[] = []
			const splitContents = contents.split('\n')

			this.contents = createTasks(splitContents, newTasks)
		}

		function createTasks(contents: string[], tasks: Task[]): Task[] {
			for (let i = 0; i < contents.length; i++) {
				if (i + 1 >= contents.length) { //isLastIndex
					const task = new Task(contents[i], contents[i].contains('- [x]'))
					tasks.push(task)
					return tasks
				}

				const currentDepth = getDepth(contents[i])
				const nextDepth = getDepth(contents[i + 1])

				if (currentDepth < nextDepth) { //hasChildren
					const children = createTasks([...contents].splice(i + 1, contents.length), [])
					const task = new Task(contents[i], contents[i].contains('- [x]'), children)
					tasks.push(task)
					i += children.length //pass children index
					continue
				}

				if (currentDepth > nextDepth) {
					const task = new Task(contents[i], contents[i].contains('- [x]'))
					tasks.push(task)
					return tasks
				}

				if (currentDepth === nextDepth) {
					const task = new Task(contents[i], contents[i].contains('- [x]'))
					tasks.push(task)
				}

			}

			return tasks
		}

		function getDepth(content: string) {
			const depth = content.match(/\t/g)
			return depth ? depth.length : 0
		}
	}

	getCheckedTasks(): Tasks {
		const result: Task[] = []
		for (const content of this.contents) {
			if (content.hasChildren()) {
				const checkedChildren = content.children.filter(child => child.checked)
				if (checkedChildren.length > 0) {
					const task = new Task(
						content.content,
						content.checked,
						checkedChildren
					)
					result.push(task)
					continue
				}
			}

			if (content.checked) {
				result.push(content)
			}
		}

		return new Tasks(
			undefined,
			result
		)
	}

	getUnCheckedTasks() {
		const result: Task[] = []
		for (const content of this.contents) {
			if (content.hasChildren()) {
				const checkedChildren = content.children.filter(child => !child.checked)
				const task = new Task(
					content.content,
					content.checked,
					checkedChildren
				)
				result.push(task)
				continue
			}

			if (!content.checked) {
				result.push(content)
			}
		}

		return new Tasks(
			undefined,
			result
		)
	}

	add(tasks: Tasks) {
		this.contents.push(...tasks.contents)
	}

	addEmoji(emoji: string) {
		return new Tasks(
			undefined,
			this.contents = this.contents.map(content => {
				return new Task(
					content.content + emoji,
					content.checked,
					content.children);
			}))
	}

	splitFirst(delimiter: string) {
		return new Tasks(
			undefined,
			this.contents = this.contents
				.map(content => {
					return new Task(
						content.content.replace('- [x]', '- [ ]').split(delimiter)[0],
						content.checked,
						content.children.map(child => {
							return new Task(
								child.content.replace('- [x]', '- [ ]').split(delimiter)[0],
								child.checked,
								child.children
							)
						}));
				}))
	}
}

export class Task {
	content: string
	checked: boolean
	children: Task[] = []

	constructor(content: string, checked: boolean, children?: Task[]) {
		this.content = content
		this.checked = checked
		this.children = children == undefined ? [] : children
	}

	hasChildren() {
		return this.children.length != 0;

	}

	convertToString() {
		if (this.hasChildren()) {
			return [
				this.content,
				...this.children.map(child => child.content)
			].join('\n')
		}
		return this.content
	}

}

