import type { Patient } from "../data/patients"

export type PushNotificationType = "afib-detected"

export interface PushNotification {
  id: string
  type: PushNotificationType
  patientId: string
  patientName: string
  title: string
  message: string
  createdAt: Date
}

type NotificationListener = (notification: PushNotification) => void

class NotificationService {
  private listeners = new Set<NotificationListener>()

  subscribe(listener: NotificationListener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  pushAfibDetected(patient: Patient): PushNotification {
    const notification: PushNotification = {
      id: `${patient.id}-${Date.now()}`,
      type: "afib-detected",
      patientId: patient.id,
      patientName: patient.name,
      title: "AFib Detected",
      message: `${patient.name} has a newly detected AFib event.`,
      createdAt: new Date(),
    }
    this.emit(notification)
    return notification
  }

  private emit(notification: PushNotification) {
    this.listeners.forEach((listener) => listener(notification))
  }
}

export const notificationService = new NotificationService()
