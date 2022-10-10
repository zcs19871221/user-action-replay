# Scenes to be used

Consider these user scenarios:

- The BE successfully returns data, the FE parsing fails or data missing some properties cause the page to crash.
- The page is unresponsive after an operation due to an unpredictable FE bug.

These scenarios will have a great impact on users, but in the BE logs, everything is Ok, because at present we do not have a good means to collect these problems. Even if we collect them, it is hard to locate where and how the problems occur.

# What can the system do

Our system can collects FE errors and more importantly replay user error actions

- So we can easily find where error happens and what is the reason.
- We can improve our system before it has a significant impact (loss of users) by periodically investigating in the system log.

# How to use

inject `<script>` tag which is in the `integration/template.html` to your system entry html page.
