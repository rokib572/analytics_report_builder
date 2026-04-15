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

type VerificationEmailProps = {
  userName: string
  verifyUrl: string
}

export const VerificationEmail = ({ userName, verifyUrl }: VerificationEmailProps) => (
  <Html>
    <Head />
    <Preview>Verify your email to continue setting up Analytics.</Preview>
    <Body style={body}>
      <Container style={container}>
        <Section style={card}>
          <Heading style={heading}>Verify your email</Heading>
          <Text style={paragraph}>Hi {userName},</Text>
          <Text style={paragraph}>
            Confirm your email address to finish setting up your Analytics account.
          </Text>
          <Button href={verifyUrl} style={button}>
            Verify email
          </Button>
          <Text style={paragraph}>
            Or copy this link into your browser:
            <br />
            <a href={verifyUrl} style={link}>
              {verifyUrl}
            </a>
          </Text>
          <Hr style={divider} />
          <Text style={footer}>
            This link expires in 1 hour. If you did not create this account, you can ignore this
            email.
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
