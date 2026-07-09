export type EcgLabel = "AFIB" | "N"

export interface EcgExample {
  datasetIndex: number
  recordId: string
  trueCodes: EcgLabel[]
  predictedCodes: EcgLabel[]
  isCorrect: boolean
  rawImage: string    // served from /ecg/...
  gradcamImage: string
  gradcamClass: EcgLabel
}

export const ecgExamples: EcgExample[] = [
  {
    datasetIndex: 2951,
    recordId: "04746 / seg 00499",
    trueCodes: ["AFIB"],
    predictedCodes: ["AFIB"],
    isCorrect: true,
    rawImage: "/ecg/AFIB/example_002951_raw.png",
    gradcamImage: "/ecg/AFIB/example_002951_gradcam.png",
    gradcamClass: "AFIB",
  },
  {
    datasetIndex: 9434,
    recordId: "07879 / seg 00297",
    trueCodes: ["AFIB"],
    predictedCodes: ["AFIB"],
    isCorrect: true,
    rawImage: "/ecg/AFIB/example_009434_raw.png",
    gradcamImage: "/ecg/AFIB/example_009434_gradcam.png",
    gradcamClass: "AFIB",
  },
  {
    datasetIndex: 10315,
    recordId: "07910 / seg 00565",
    trueCodes: ["AFIB"],
    predictedCodes: ["AFIB"],
    isCorrect: true,
    rawImage: "/ecg/AFIB/example_010315_raw.png",
    gradcamImage: "/ecg/AFIB/example_010315_gradcam.png",
    gradcamClass: "AFIB",
  },
  {
    datasetIndex: 12467,
    recordId: "08405 / seg 00265",
    trueCodes: ["AFIB"],
    predictedCodes: ["AFIB"],
    isCorrect: true,
    rawImage: "/ecg/AFIB/example_012467_raw.png",
    gradcamImage: "/ecg/AFIB/example_012467_gradcam.png",
    gradcamClass: "AFIB",
  },
  {
    datasetIndex: 13904,
    recordId: "08455 / seg 00476",
    trueCodes: ["AFIB"],
    predictedCodes: ["AFIB"],
    isCorrect: true,
    rawImage: "/ecg/AFIB/example_013904_raw.png",
    gradcamImage: "/ecg/AFIB/example_013904_gradcam.png",
    gradcamClass: "AFIB",
  },
  {
    datasetIndex: 368,
    recordId: "04015 / seg 00368",
    trueCodes: ["N"],
    predictedCodes: ["N"],
    isCorrect: true,
    rawImage: "/ecg/N/example_000368_raw.png",
    gradcamImage: "/ecg/N/example_000368_gradcam.png",
    gradcamClass: "N",
  },
  {
    datasetIndex: 1418,
    recordId: "04048 / seg 00192",
    trueCodes: ["N"],
    predictedCodes: ["N"],
    isCorrect: true,
    rawImage: "/ecg/N/example_001418_raw.png",
    gradcamImage: "/ecg/N/example_001418_gradcam.png",
    gradcamClass: "N",
  },
  {
    datasetIndex: 1756,
    recordId: "04048 / seg 00530",
    trueCodes: ["N"],
    predictedCodes: ["N"],
    isCorrect: true,
    rawImage: "/ecg/N/example_001756_raw.png",
    gradcamImage: "/ecg/N/example_001756_gradcam.png",
    gradcamClass: "N",
  },
  {
    datasetIndex: 3558,
    recordId: "04908 / seg 00493",
    trueCodes: ["N"],
    predictedCodes: ["N"],
    isCorrect: true,
    rawImage: "/ecg/N/example_003558_raw.png",
    gradcamImage: "/ecg/N/example_003558_gradcam.png",
    gradcamClass: "N",
  },
  {
    datasetIndex: 4750,
    recordId: "05091 / seg 00459",
    trueCodes: ["N"],
    predictedCodes: ["N"],
    isCorrect: true,
    rawImage: "/ecg/N/example_004750_raw.png",
    gradcamImage: "/ecg/N/example_004750_gradcam.png",
    gradcamClass: "N",
  },
  {
    datasetIndex: 4928,
    recordId: "05121 / seg 00024",
    trueCodes: ["N"],
    predictedCodes: ["N"],
    isCorrect: true,
    rawImage: "/ecg/N/example_004928_raw.png",
    gradcamImage: "/ecg/N/example_004928_gradcam.png",
    gradcamClass: "N",
  },
  {
    datasetIndex: 12248,
    recordId: "08405 / seg 00046",
    trueCodes: ["N"],
    predictedCodes: ["N"],
    isCorrect: true,
    rawImage: "/ecg/N/example_012248_raw.png",
    gradcamImage: "/ecg/N/example_012248_gradcam.png",
    gradcamClass: "N",
  },
]
