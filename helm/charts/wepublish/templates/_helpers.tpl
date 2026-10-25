{{/* vim: set filetype=mustache: */}}
{{/*
Expand the name of the chart.
*/}}
{{- define "helm.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "helm.fullname" -}}
{{- if .Values.fullnameOverride -}}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- $name := default .Chart.Name .Values.nameOverride -}}
{{- if contains $name .Release.Name -}}
{{- .Release.Name | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" -}}
{{- end -}}
{{- end -}}
{{- end -}}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "helm.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "helm.observability.enabled" -}}
{{- if (.Values.observability | default dict).enabled -}}true{{- end -}}
{{- end -}}

{{- define "helm.observability.tenant" -}}
{{- $obs := .Values.observability | default dict -}}
{{- $obs.tenant | default (dig "APP_NAME" "" (.Values.deployment.env | default dict)) | required "observability.tenant (or deployment.env.APP_NAME) is required when observability.enabled is true" -}}
{{- end -}}

{{- define "helm.observability.environment" -}}
{{- $obs := .Values.observability | default dict -}}
{{- $obs.environment | default (dig "APP_ENVIRONMENT" "" (.Values.deployment.env | default dict)) | required "observability.environment (or deployment.env.APP_ENVIRONMENT) is required when observability.enabled is true" -}}
{{- end -}}

{{- define "helm.observability.podLabels" -}}
wepublish.ch/tenant: {{ include "helm.observability.tenant" .root | quote }}
wepublish.ch/component: {{ .component | quote }}
wepublish.ch/environment: {{ include "helm.observability.environment" .root | quote }}
{{- end -}}

{{- define "helm.observability.env" -}}
{{- $root := .root -}}
{{- $obs := $root.Values.observability -}}
{{- $tenant := include "helm.observability.tenant" $root -}}
{{- $environment := include "helm.observability.environment" $root -}}
{{- $userEnv := merge (deepCopy (.values.env | default dict)) (deepCopy ($root.Values.deployment.env | default dict)) (deepCopy (.values.dynamicEnv | default dict)) -}}
{{- $env := dict
  "OTEL_EXPORTER_OTLP_ENDPOINT" (required "observability.otlpEndpoint is required when observability.enabled is true" $obs.otlpEndpoint)
  "OTEL_EXPORTER_OTLP_PROTOCOL" "http/protobuf"
  "OTEL_TRACES_EXPORTER" "otlp"
  "OTEL_LOGS_EXPORTER" (ternary "none" "otlp" (eq .component "editor"))
  "OTEL_METRICS_EXPORTER" "otlp"
  "OTEL_METRIC_EXPORT_INTERVAL" "15000"
  "OTEL_EXPORTER_OTLP_METRICS_TEMPORALITY_PREFERENCE" "cumulative"
  "OTEL_SEMCONV_STABILITY_OPT_IN" "http"
  "OTEL_SERVICE_NAME" (printf "wepublish-%s" .component)
  "OTEL_RESOURCE_ATTRIBUTES" (printf "service.namespace=%s,deployment.environment.name=%s,k8s.namespace.name=%s" $tenant $environment $root.Release.Namespace)
-}}
{{- if eq .component "website" -}}
{{- $_ := set $env "OTEL_WEBSITE_TRACES" (ternary "true" "false" (eq (toString $obs.websiteTraces) "true")) -}}
{{- end -}}
{{- range $name, $value := $env }}
{{- if not (hasKey $userEnv $name) }}
- name: {{ $name }}
  value: {{ $value | quote }}
{{- end }}
{{- end }}
{{- if not (hasKey $userEnv "OTEL_SERVICE_INSTANCE_ID") }}
- name: OTEL_SERVICE_INSTANCE_ID
  valueFrom:
    fieldRef:
      fieldPath: metadata.name
{{- end }}
{{- end -}}
