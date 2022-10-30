import { IBalancer } from 'src/interfaces/balancer.interface'
import { IService } from 'src/interfaces/service.interface'

class Balancer implements IBalancer {
	services: IService[] = []

	addService(url: string, title: string): void {
		const service: IService = {
			url,
			title: Symbol.for(title),
			connections: 0
		}
		this.services.push(service)
	}

	sortServices(a: IService, b: IService): number {
		return a.connections - b.connections
	}

	getService(): IService | null {
		if (this.services.length == 0) {
			return null
		}
		this.services.sort(this.sortServices)
		const service = this.services[0]
		service.connections++
		return service
	}

	releaseService(title: symbol): void {
		const service = this.services.find((s) => s.title === title)
		service.connections--
	}
}

export default new Balancer()
