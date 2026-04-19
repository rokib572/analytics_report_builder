import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components"

type PasswordResetEmailProps = {
  userName: string
  resetUrl: string
}

export const PasswordResetEmail = ({ userName, resetUrl }: PasswordResetEmailProps) => (
  <Html>
    <Head />
    <Preview>Reset your Analytics password.</Preview>
    <Body style={body}>
      <Container style={container}>
        <Section style={card}>
          <Heading style={heading}>Reset your password</Heading>
          <Text style={paragraph}>Hi {userName},</Text>
          <Text style={paragraph}>
            We received a request to reset the password for your Analytics account.
          </Text>
          <Button href={resetUrl} style={button}>
            Reset password
          </Button>
          <Text style={paragraph}>
            Or copy this link into your browser:
            <br />
            <a href={resetUrl} style={link}>
              {resetUrl}
            </a>
          </Text>
          <Hr style={divider} />
          <Text style={footer}>
            This link expires in 1 hour. If you did not request a password reset, you can ignore
            this email.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

const body = {
  backgroundColor: "#f8fafc",
  fontFamily: "Arial, sans-serif",
  margin: 0,
  padding: "24px 0",
}

const container = {
  margin: "0 auto",
  maxWidth: "600px",
  padding: "0 16px",
}

const card = {
  backgroundColor: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: "12px",
  padding: "32px",
}

const heading = {
  color: "#0f172a",
  fontSize: "28px",
  fontWeight: "700",
  lineHeight: "1.2",
  margin: "0 0 16px",
}

const paragraph = {
  color: "#334155",
  fontSize: "16px",
  lineHeight: "1.6",
  margin: "0 0 16px",
}

const button = {
  backgroundColor: "#0f172a",
  borderRadius: "8px",
  color: "#ffffff",
  display: "inline-block",
  fontSize: "16px",
  fontWeight: "600",
  padding: "12px 20px",
  textDecoration: "none",
  margin: "8px 0 24px",
}

const link = {
  color: "#2563eb",
  textDecoration: "underline",
  wordBreak: "break-all" as const,
}

const divider = {
  borderColor: "#e2e8f0",
  margin: "24px 0",
}

const footer = {
  color: "#64748b",
  fontSize: "14px",
  lineHeight: "1.5",
  margin: 0,
}
