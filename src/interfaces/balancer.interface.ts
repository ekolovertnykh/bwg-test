import { IService } from './service.interface'

export interface IBalancer {
	services: IService[]
	addService: (url: string, title: string) => void
	sortServices: (serviceA: IService, serviceB: IService) => number
	getService: () => IService | null
	releaseService: (title: symbol) => void
}
