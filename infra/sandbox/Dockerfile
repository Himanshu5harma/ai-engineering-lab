FROM python:3.12.12-slim
RUN mkdir -p /runner && chmod 755 /runner
COPY --chmod=444 entrypoint.py /runner/entrypoint.py
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
USER 65534:65534
WORKDIR /tmp
ENTRYPOINT ["python", "-I", "-B", "/runner/entrypoint.py"]
