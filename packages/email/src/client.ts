import nodemailer, { type Transporter } from "nodemailer"
import { loadEmailConfig } from "./config"

let cachedTransporter: Transporter | null = null

export const getTransporter = (): Transporter => {
  if (cachedTransporter) return cachedTransporter

  const config = loadEmailConfig()

  console.log("Creating new email transporter with config:", { ...config })

  cachedTransporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.password,
    },
  })

  return cachedTransporter
}

export const resetTransporter = (): void => {
  cachedTransporter = null
}
