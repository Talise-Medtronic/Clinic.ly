import { ecgExamples, type EcgExample } from "../data/ecg"
import { patients, type Patient } from "../data/patients"
import { notificationService } from "./notificationService"

export interface EcgIngestionEvent {
  id: string
  patientId: string
  patientName: string
  timestamp: Date
  example: EcgExample
}

export interface EcgIngestionDebugSnapshot {
  activePatientCount: number
  afibEligibleCount: number
  lastDetectionAt: Date | null
  tickMs: number
  ecgsIngestedCount: number
  afibEventsDetectedCount: number
}

type IngestionListener = (event: EcgIngestionEvent) => void

class EcgIngestionService {
  private listeners = new Set<IngestionListener>()
  private scopedSubscriptions = new Map<string, Set<string>>()
  private timerId: number | null = null
  private eventCounter = 0
  private lastDetectedByPatient = new Map<string, number>()
  private lastDetectionAtMs: number | null = null
  private ecgsIngestedCount = 0
  private afibEventsDetectedCount = 0

  private readonly tickMs = 20_000
  private readonly afibChance = 0.4
  private readonly cooldownMs = 45_000

  start() {
    if (this.timerId !== null) return
    this.runDetectionTick()
    this.timerId = window.setInterval(() => this.runDetectionTick(), this.tickMs)
  }

  stop() {
    if (this.timerId === null) return
    window.clearInterval(this.timerId)
    this.timerId = null
  }

  subscribe(listener: IngestionListener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  subscribeScope(scopeId: string, patientIds: string[]) {
    this.scopedSubscriptions.set(scopeId, new Set(patientIds))
    // Run immediately after scope changes so notifications do not wait for the next interval tick.
    this.runDetectionTick()
  }

  unsubscribeScope(scopeId: string) {
    this.scopedSubscriptions.delete(scopeId)
  }

  getDebugSnapshot(): EcgIngestionDebugSnapshot {
    const activePatientIds = this.getActivePatientIds()
    let afibEligibleCount = 0

    activePatientIds.forEach((patientId) => {
      const patient = patients.find((p) => p.id === patientId)
      if (patient && this.isAfibPatient(patient)) afibEligibleCount += 1
    })

    return {
      activePatientCount: activePatientIds.size,
      afibEligibleCount,
      lastDetectionAt: this.lastDetectionAtMs ? new Date(this.lastDetectionAtMs) : null,
      tickMs: this.tickMs,
      ecgsIngestedCount: this.ecgsIngestedCount,
      afibEventsDetectedCount: this.afibEventsDetectedCount,
    }
  }

  private runDetectionTick() {
    const activePatientIds = this.getActivePatientIds()
    if (activePatientIds.size === 0) return

    const afibPool = ecgExamples.filter((e) => e.gradcamClass === "AFIB")
    if (afibPool.length === 0) return

    const nowMs = Date.now()

    activePatientIds.forEach((patientId) => {
      const patient = patients.find((p) => p.id === patientId)
      if (!patient) return
      this.ecgsIngestedCount += 1
      if (!this.isAfibPatient(patient)) return

      const isSergey = patient.id === "p3"
      const lastDetected = this.lastDetectedByPatient.get(patient.id)
      if (!isSergey && lastDetected && nowMs - lastDetected < this.cooldownMs) return

      // Test override: Sergey is always AFIB-positive for demo validation.
      // Ensure at least one immediate detection per AFIB patient in a session, then use probability.
      const shouldDetectAfib = isSergey || !lastDetected || Math.random() < this.afibChance
      if (!shouldDetectAfib) return

      this.lastDetectedByPatient.set(patient.id, nowMs)
      this.lastDetectionAtMs = nowMs
      this.afibEventsDetectedCount += 1
      const example = afibPool[this.eventCounter % afibPool.length]
      this.eventCounter += 1

      const event: EcgIngestionEvent = {
        id: `${patient.id}-${nowMs}-${this.eventCounter}`,
        patientId: patient.id,
        patientName: patient.name,
        timestamp: new Date(nowMs),
        example,
      }

      this.emit(event)
      notificationService.pushAfibDetected(patient)
    })
  }

  private emit(event: EcgIngestionEvent) {
    this.listeners.forEach((listener) => listener(event))
  }

  private getActivePatientIds(): Set<string> {
    const ids = new Set<string>()
    this.scopedSubscriptions.forEach((patientSet) => {
      patientSet.forEach((patientId) => ids.add(patientId))
    })
    return ids
  }

  private isAfibPatient(patient: Patient): boolean {
    const text = `${patient.alertTitle} ${patient.alertDescription}`.toLowerCase()
    return /(afib|af|atrial fib|atrial fibrillation)/.test(text)
  }
}

export const ecgIngestionService = new EcgIngestionService()
