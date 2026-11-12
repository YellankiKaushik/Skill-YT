FROM python:3.12-slim
RUN useradd --uid 65532 --no-create-home --shell /usr/sbin/nologin inspector
WORKDIR /app
RUN mkdir /input && chmod 0555 /input
COPY inspect_html.py /app/inspect_html.py
USER 65532:65532
ENTRYPOINT ["python", "-I", "/app/inspect_html.py", "/input/page.html"]

