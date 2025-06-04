import resend

resend.api_key = "re_NajJd2cM_4hhrPJzD19CxaMRiYouZnBaB"

params: resend.Emails.SendParams = {
  "from": "HSD <onboarding@hpique.nl>",
  "to": ["harmonymwithalii@gmail.com"],
  "subject": "hello world",
  "html": "<p>it works!</p>"
}

email = resend.Emails.send(params)
print(email)