import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Save, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Textarea } from "@/src/components/ui/textarea";
import { Badge } from "@/src/components/ui/badge";
import { prototypeAssumptionNote } from "@/src/data";
import { useData } from "@/src/contexts/DataContext";
import {
  AttentionBehaviorSupportLevel,
  CommunicationLevel,
  ConsentStatus,
  DataAccessSensitivity,
  DiagnosisStatus,
  HistoryAvailability,
  HistoryRecommendationUse,
  HistorySource,
  HistorySummary,
  HistorySummaryEntry,
  IdentifiedCondition,
  Learner,
  LearnerGender,
  PrivacyMode,
  ProgressStatus,
  SupportLevel,
} from "@/src/types";

const diagnosisStatuses: DiagnosisStatus[] = ["Diagnosed", "No formal diagnosis", "For evaluation", "Not disclosed"];
const identifiedConditions: IdentifiedCondition[] = [
  "Autism Spectrum Disorder",
  "ADHD",
  "Dyslexia",
  "Intellectual Disability",
  "Speech/Language Difficulty",
  "Multiple Disabilities",
  "Other",
  "Not specified",
];
const communicationLevels: CommunicationLevel[] = ["Verbal", "Limited verbal", "Non-verbal", "Uses AAC/visual support", "Not specified"];
const attentionSupportLevels: AttentionBehaviorSupportLevel[] = ["Low", "Moderate", "High"];
const consentStatuses: ConsentStatus[] = ["Granted", "Pending", "Limited", "Not granted"];
const dataSensitivityLevels: DataAccessSensitivity[] = ["Standard", "Restricted", "Highly restricted"];
const privacyModes: PrivacyMode[] = ["Named Record", "Anonymized Record"];
const supportLevels: SupportLevel[] = ["Low Support Need", "Moderate Support Need", "High Support Need"];
const progressStatuses: ProgressStatus[] = ["Stable", "Improving", "Needs Modified Support"];
const genderOptions: LearnerGender[] = ["Male", "Female", "Other", "Not disclosed"];
const historyAvailabilities: HistoryAvailability[] = ["Available", "Not available", "For follow-up", "Not disclosed", "Not authorized"];
const historySources: HistorySource[] = [
  "Parent/guardian report",
  "Dev Ped report",
  "Medical record",
  "School record",
  "OT report",
  "ST report",
  "ABA report",
  "SPED report",
  "Teacher observation",
];
const historyRecommendationUses: HistoryRecommendationUse[] = ["Yes", "No", "Unsure", "Restricted"];

const historySections: Array<{
  key: keyof HistorySummary;
  title: string;
  className?: string;
}> = [
  { key: "medicalHistory", title: "Medical History" },
  { key: "developmentalHistory", title: "Developmental History" },
  { key: "familyHistory", title: "Family History" },
  { key: "academicHistory", title: "Academic History" },
  { key: "relatedServiceHistory", title: "OT / ST / ABA / SPED Report Summary", className: "md:col-span-2" },
];

type FormState = {
  code: string;
  displayName: string;
  anonymizedId: string;
  privacyMode: PrivacyMode;
  gradeLevel: string;
  age: string;
  gender: LearnerGender;
  disabilityCategory: string;
  diagnosisStatus: DiagnosisStatus;
  identifiedCondition: IdentifiedCondition;
  communicationLevel: CommunicationLevel;
  attentionBehaviorSupportLevel: AttentionBehaviorSupportLevel;
  sensoryLearningConsiderations: string;
  currentReadingLevel: string;
  readingConcerns: string;
  supportNeeds: SupportLevel;
  accommodations: string;
  iepGoals: string;
  consentStatus: ConsentStatus;
  dataAccessSensitivity: DataAccessSensitivity;
  historySummary: HistorySummary;
  status: ProgressStatus;
};

const initialFormState: FormState = {
  code: "",
  displayName: "",
  anonymizedId: "",
  privacyMode: "Named Record",
  gradeLevel: "",
  age: "",
  gender: "Male",
  disabilityCategory: "",
  diagnosisStatus: "Not disclosed",
  identifiedCondition: "Not specified",
  communicationLevel: "Not specified",
  attentionBehaviorSupportLevel: "Moderate",
  sensoryLearningConsiderations: "",
  currentReadingLevel: "",
  readingConcerns: "",
  supportNeeds: "Moderate Support Need",
  accommodations: "",
  iepGoals: "",
  consentStatus: "Pending",
  dataAccessSensitivity: "Standard",
  historySummary: buildEmptyHistorySummary(),
  status: "Stable",
};

export function LearnerForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { learners, addLearner, updateLearner } = useData();
  const isEdit = Boolean(id) && id !== "new";
  const [isSaved, setIsSaved] = useState(false);
  const [formData, setFormData] = useState<FormState>(initialFormState);

  useEffect(() => {
    if (!isEdit || !id) return;
    const learner = learners.find((entry) => entry.id === id);
    if (!learner) return;
    setFormData(mapLearnerToForm(learner));
  }, [id, isEdit, learners]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      if (name === "privacyMode" && value === "Anonymized Record" && !prev.anonymizedId.trim()) {
        next.anonymizedId = `${prev.code || "Learner"}-${new Date().getFullYear()}`;
      }
      return next;
    });
  };

  const handleHistoryChange = <K extends keyof HistorySummary, F extends keyof HistorySummaryEntry>(
    sectionKey: K,
    field: F,
    value: HistorySummaryEntry[F]
  ) => {
    setFormData((prev) => {
      const currentSection = prev.historySummary[sectionKey];
      const nextSection: HistorySummaryEntry = { ...currentSection, [field]: value };

      if (field === "availability") {
        if (value === "Not authorized" || value === "Not disclosed") {
          nextSection.useInRecommendation = "Restricted";
        } else if (value === "Not available") {
          nextSection.useInRecommendation = "No";
        } else if (currentSection.useInRecommendation === "Restricted") {
          nextSection.useInRecommendation = "Unsure";
        }
      }

      if (field === "useInRecommendation" && isRestrictedStatus(nextSection.availability) && value !== "Restricted") {
        nextSection.useInRecommendation = "Restricted";
      }

      return {
        ...prev,
        historySummary: {
          ...prev.historySummary,
          [sectionKey]: nextSection,
        },
      };
    });
  };

  const handleNumberInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    const allowedKeys = ["Backspace", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Delete", "Tab", "Enter", "Escape"];
    if (event.ctrlKey || event.metaKey) return;
    if (!allowedKeys.includes(event.key) && !/^[0-9]$/.test(event.key)) {
      event.preventDefault();
      toast.error("Invalid Input", {
        description: "Please enter numbers only. Letters and special characters are not accepted.",
      });
    }
  };

  const handleNumberInputPaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    const pastedData = event.clipboardData.getData("text");
    if (!/^\d+$/.test(pastedData)) {
      event.preventDefault();
      toast.error("Invalid Input", {
        description: "Please enter numbers only. Letters and special characters are not accepted.",
      });
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const parsedData = parseForm(formData, isEdit && id ? learners.find((entry) => entry.id === id)?.interventionHistory || [] : []);

    if (!parsedData.disabilityCategory.trim()) {
      toast.error("Learner support profile required", {
        description: "Please specify the disability category or identified learning need before saving.",
      });
      return;
    }

    if (isEdit && id) {
      updateLearner(id, parsedData);
    } else {
      addLearner(parsedData);
    }

    setIsSaved(true);
    setTimeout(() => navigate("/learners"), 1200);
  };

  return (
    <div className="relative space-y-6 pb-10">
      {isSaved && (
        <div className="absolute left-0 right-0 top-0 z-50 flex justify-center">
          <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-800 shadow-lg dark:border-green-800 dark:bg-green-900/40 dark:text-green-100">
            <CheckCircle2 size={18} />
            <p className="font-medium">Learner support profile saved.</p>
          </div>
        </div>
      )}

      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} disabled={isSaved}>
          <ArrowLeft size={16} />
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            {isEdit ? "Edit Learner Support Profile" : "Add Learner Support Profile"}
          </h2>
          <p className="mt-1 max-w-3xl text-slate-500 dark:text-slate-400">
            Record the learner profile used for reading support planning, external report encoding, intervention review, and progress monitoring.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-blue-100 bg-blue-50/80 p-4 text-sm text-blue-900 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-100">
        <div className="flex items-start gap-3">
          <ShieldCheck size={18} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold">Prototype note</p>
            <p className="mt-1 leading-relaxed">{prototypeAssumptionNote}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Identity and Access</CardTitle>
            <CardDescription>Capture the learner record format, consent status, and access sensitivity before encoding detailed support information.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <Field label="Learner Code" htmlFor="code" helper="Required center identifier used across reports and workflows.">
              <Input id="code" name="code" value={formData.code} onChange={handleChange} required placeholder="e.g., RA-2026-007" disabled={isSaved} />
            </Field>
            <Field label="Privacy Mode" htmlFor="privacyMode" helper="Use anonymized mode when names should not appear in general workflow views.">
              <select id="privacyMode" name="privacyMode" value={formData.privacyMode} onChange={handleChange} disabled={isSaved} className={selectClassName}>
                {privacyModes.map((mode) => (
                  <option key={mode} value={mode}>
                    {mode}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Learner Name" htmlFor="displayName" helper="Keep the real name here when consent and privacy rules allow named records.">
              <Input id="displayName" name="displayName" value={formData.displayName} onChange={handleChange} placeholder="e.g., Maria S." disabled={isSaved} />
            </Field>
            <Field label="Anonymized Identifier" htmlFor="anonymizedId" helper="Required when privacy mode is anonymized. This label can appear in dashboards and reports.">
              <Input
                id="anonymizedId"
                name="anonymizedId"
                value={formData.anonymizedId}
                onChange={handleChange}
                required={formData.privacyMode === "Anonymized Record"}
                placeholder="e.g., Learner Echo-05"
                disabled={isSaved}
              />
            </Field>
            <Field label="Consent Status" htmlFor="consentStatus" helper="Consent should remain visible throughout the learner workflow.">
              <select id="consentStatus" name="consentStatus" value={formData.consentStatus} onChange={handleChange} disabled={isSaved} className={selectClassName}>
                {consentStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Data Access Sensitivity" htmlFor="dataAccessSensitivity" helper="Use restricted levels when external reports or medical/developmental details must be handled carefully.">
              <select
                id="dataAccessSensitivity"
                name="dataAccessSensitivity"
                value={formData.dataAccessSensitivity}
                onChange={handleChange}
                disabled={isSaved}
                className={selectClassName}
              >
                {dataSensitivityLevels.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Learner Support Profile</CardTitle>
            <CardDescription>Required support-planning fields. Formal diagnosis may be absent, under evaluation, or undisclosed.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Grade Level" htmlFor="gradeLevel">
                <select id="gradeLevel" name="gradeLevel" value={formData.gradeLevel} onChange={handleChange} required disabled={isSaved} className={selectClassName}>
                  <option value="">Select grade</option>
                  <option value="Grade 1">Grade 1</option>
                  <option value="Grade 2">Grade 2</option>
                  <option value="Grade 3">Grade 3</option>
                  <option value="Grade 4">Grade 4</option>
                  <option value="Grade 5">Grade 5</option>
                  <option value="Grade 6">Grade 6</option>
                </select>
              </Field>
              <Field label="Age" htmlFor="age">
                <Input
                  id="age"
                  name="age"
                  type="number"
                  min="4"
                  max="18"
                  value={formData.age}
                  onChange={handleChange}
                  onKeyDown={handleNumberInputKeyDown}
                  onPaste={handleNumberInputPaste}
                  required
                  disabled={isSaved}
                />
              </Field>
              <Field label="Gender" htmlFor="gender">
                <select id="gender" name="gender" value={formData.gender} onChange={handleChange} disabled={isSaved} className={selectClassName}>
                  {genderOptions.map((gender) => (
                    <option key={gender} value={gender}>
                      {gender}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Disability Category or Identified Learning Need" htmlFor="disabilityCategory" helper="Required. This should reflect the learner support profile even when formal diagnosis is not yet available.">
                <Input
                  id="disabilityCategory"
                  name="disabilityCategory"
                  value={formData.disabilityCategory}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Specific reading comprehension support need"
                  disabled={isSaved}
                />
              </Field>
              <Field label="Diagnosis Status" htmlFor="diagnosisStatus" helper="This field should never block saving.">
                <select id="diagnosisStatus" name="diagnosisStatus" value={formData.diagnosisStatus} onChange={handleChange} disabled={isSaved} className={selectClassName}>
                  {diagnosisStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Identified Condition" htmlFor="identifiedCondition">
                <select id="identifiedCondition" name="identifiedCondition" value={formData.identifiedCondition} onChange={handleChange} disabled={isSaved} className={selectClassName}>
                  {identifiedConditions.map((condition) => (
                    <option key={condition} value={condition}>
                      {condition}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Communication Level" htmlFor="communicationLevel">
                <select id="communicationLevel" name="communicationLevel" value={formData.communicationLevel} onChange={handleChange} disabled={isSaved} className={selectClassName}>
                  {communicationLevels.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Attention / Behavior Support Level" htmlFor="attentionBehaviorSupportLevel">
                <select id="attentionBehaviorSupportLevel" name="attentionBehaviorSupportLevel" value={formData.attentionBehaviorSupportLevel} onChange={handleChange} disabled={isSaved} className={selectClassName}>
                  {attentionSupportLevels.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Current Support Need Estimate" htmlFor="supportNeeds">
                <select id="supportNeeds" name="supportNeeds" value={formData.supportNeeds} onChange={handleChange} disabled={isSaved} className={selectClassName}>
                  {supportLevels.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Current Reading Level or Reading Concern Summary" htmlFor="currentReadingLevel">
                <Input
                  id="currentReadingLevel"
                  name="currentReadingLevel"
                  value={formData.currentReadingLevel}
                  onChange={handleChange}
                  placeholder="e.g., Short paragraph level with guided support"
                  disabled={isSaved}
                />
              </Field>
              <Field label="Progress Status" htmlFor="status">
                <select id="status" name="status" value={formData.status} onChange={handleChange} disabled={isSaved} className={selectClassName}>
                  {progressStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="Reading Concerns" htmlFor="readingConcerns" helper="Use comma-separated concerns such as vocabulary, sequencing, attention during reading task, or prompting needed.">
              <Input
                id="readingConcerns"
                name="readingConcerns"
                value={formData.readingConcerns}
                onChange={handleChange}
                placeholder="e.g., Vocabulary, Inferential Comprehension, Attention During Reading Task"
                disabled={isSaved}
              />
            </Field>

            <Field label="Sensory / Learning Considerations" htmlFor="sensoryLearningConsiderations" helper="One consideration per line keeps later reports easier to read.">
              <Textarea
                id="sensoryLearningConsiderations"
                name="sensoryLearningConsiderations"
                value={formData.sensoryLearningConsiderations}
                onChange={handleChange}
                className="min-h-[100px]"
                placeholder="e.g., Benefits from chunked tasks&#10;Needs reduced noise during reading"
                disabled={isSaved}
              />
            </Field>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Existing Accommodations" htmlFor="accommodations" helper="Use comma-separated accommodations for quick dashboard and report summaries.">
                <Textarea
                  id="accommodations"
                  name="accommodations"
                  value={formData.accommodations}
                  onChange={handleChange}
                  className="min-h-[110px]"
                  placeholder="e.g., Visual timer, oral response option, graphic organizer"
                  disabled={isSaved}
                />
              </Field>
              <Field label="Individualized / IEP-Aligned Goals" htmlFor="iepGoals" helper="One goal per line helps recommendation and intervention planning stay traceable.">
                <Textarea
                  id="iepGoals"
                  name="iepGoals"
                  value={formData.iepGoals}
                  onChange={handleChange}
                  className="min-h-[110px]"
                  placeholder="e.g., State the main idea with one prompt"
                  disabled={isSaved}
                />
              </Field>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Authorized History Summary</CardTitle>
            <CardDescription>Structured fields help identify whether a record exists, where it came from, and whether it can be used as contextual support for reading-support planning.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-4 text-sm text-blue-900 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-100">
              <p className="font-semibold">Privacy and consent reminder</p>
              <p className="mt-1 leading-relaxed">Encode only authorized educational summaries, not full confidential report reproduction. These histories are supporting context only and must not replace reading assessment, observations, individualized goals, accommodations, or progress evidence.</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/40">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">Common options</p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <InlineLegend label="Status" tone="blue" value="Available / Not available / For follow-up / Not disclosed / Not authorized" />
                <InlineLegend label="Source" tone="rose" value="Parent / Dev Ped / School / OT / ST / ABA / SPED / Teacher" />
                <InlineLegend label="Use" tone="green" value="Yes / No / Unsure / Restricted" />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {historySections.map((section) => (
                <HistorySectionCard
                  key={section.key}
                  title={section.title}
                  htmlPrefix={section.key}
                  value={formData.historySummary[section.key]}
                  onChange={(field, value) => handleHistoryChange(section.key, field, value)}
                  disabled={isSaved}
                  className={section.className}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Save Behavior</CardTitle>
            <CardDescription>The system saves the learner support profile even when diagnosis or authorized-history details are absent, pending, or restricted.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Badge variant="outline">Diagnosis does not block saving</Badge>
            <Badge variant="outline">Consent is visible in profile and reports</Badge>
            <Badge variant="outline">Restricted history stays contextual only</Badge>
          </CardContent>
          <CardFooter className="justify-end border-t border-slate-100 pt-6 dark:border-slate-800">
            <Button variant="outline" type="button" className="mr-3" onClick={() => navigate(-1)} disabled={isSaved}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaved}>
              {isSaved ? "Saved" : (
                <>
                  <Save size={16} className="mr-2" /> Save Learner Profile
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}

function parseForm(formData: FormState, interventionHistory: Learner["interventionHistory"]): Omit<Learner, "id" | "createdAt" | "updatedAt"> {
  return {
    code: formData.code.trim(),
    displayName: formData.displayName.trim() || formData.code.trim(),
    anonymizedId: formData.anonymizedId.trim() || `${formData.code.trim()}-ANON`,
    privacyMode: formData.privacyMode,
    gradeLevel: formData.gradeLevel,
    age: parseInt(formData.age, 10) || 0,
    gender: formData.gender,
    disabilityCategory: formData.disabilityCategory.trim(),
    diagnosisStatus: formData.diagnosisStatus,
    identifiedCondition: formData.identifiedCondition,
    communicationLevel: formData.communicationLevel,
    attentionBehaviorSupportLevel: formData.attentionBehaviorSupportLevel,
    sensoryLearningConsiderations: splitLines(formData.sensoryLearningConsiderations),
    currentReadingLevel: formData.currentReadingLevel.trim(),
    readingConcerns: splitCommaList(formData.readingConcerns),
    supportNeeds: formData.supportNeeds,
    accommodations: splitCommaList(formData.accommodations),
    iepGoals: splitLines(formData.iepGoals),
    historySummary: normalizeHistorySummaryForSave(formData.historySummary),
    consentStatus: formData.consentStatus,
    dataAccessSensitivity: formData.dataAccessSensitivity,
    interventionHistory,
    status: formData.status,
  };
}

function mapLearnerToForm(learner: Learner): FormState {
  return {
    code: learner.code,
    displayName: learner.displayName,
    anonymizedId: learner.anonymizedId,
    privacyMode: learner.privacyMode,
    gradeLevel: learner.gradeLevel,
    age: learner.age.toString(),
    gender: learner.gender,
    disabilityCategory: learner.disabilityCategory,
    diagnosisStatus: learner.diagnosisStatus,
    identifiedCondition: learner.identifiedCondition,
    communicationLevel: learner.communicationLevel,
    attentionBehaviorSupportLevel: learner.attentionBehaviorSupportLevel,
    sensoryLearningConsiderations: learner.sensoryLearningConsiderations.join("\n"),
    currentReadingLevel: learner.currentReadingLevel,
    readingConcerns: learner.readingConcerns.join(", "),
    supportNeeds: learner.supportNeeds,
    accommodations: learner.accommodations.join(", "),
    iepGoals: learner.iepGoals.join("\n"),
    consentStatus: learner.consentStatus,
    dataAccessSensitivity: learner.dataAccessSensitivity,
    historySummary: cloneHistorySummary(learner.historySummary),
    status: learner.status,
  };
}

function buildEmptyHistorySummary(): HistorySummary {
  return {
    medicalHistory: createHistoryEntry("Medical record"),
    developmentalHistory: createHistoryEntry("Parent/guardian report"),
    familyHistory: createHistoryEntry("Parent/guardian report"),
    academicHistory: createHistoryEntry("School record"),
    relatedServiceHistory: createHistoryEntry("SPED report"),
  };
}

function createHistoryEntry(source: HistorySource): HistorySummaryEntry {
  return {
    availability: "Not available",
    source,
    useInRecommendation: "No",
    shortSummary: "",
  };
}

function cloneHistorySummary(historySummary: HistorySummary): HistorySummary {
  return {
    medicalHistory: { ...historySummary.medicalHistory },
    developmentalHistory: { ...historySummary.developmentalHistory },
    familyHistory: { ...historySummary.familyHistory },
    academicHistory: { ...historySummary.academicHistory },
    relatedServiceHistory: { ...historySummary.relatedServiceHistory },
  };
}

function normalizeHistorySummaryForSave(historySummary: HistorySummary): HistorySummary {
  return {
    medicalHistory: normalizeHistoryEntryForSave(historySummary.medicalHistory),
    developmentalHistory: normalizeHistoryEntryForSave(historySummary.developmentalHistory),
    familyHistory: normalizeHistoryEntryForSave(historySummary.familyHistory),
    academicHistory: normalizeHistoryEntryForSave(historySummary.academicHistory),
    relatedServiceHistory: normalizeHistoryEntryForSave(historySummary.relatedServiceHistory),
  };
}

function normalizeHistoryEntryForSave(entry: HistorySummaryEntry): HistorySummaryEntry {
  if (isRestrictedStatus(entry.availability)) {
    return {
      ...entry,
      useInRecommendation: "Restricted",
      shortSummary: entry.shortSummary.trim(),
    };
  }

  if (entry.availability === "Not available") {
    return {
      ...entry,
      useInRecommendation: "No",
      shortSummary: entry.shortSummary.trim(),
    };
  }

  return {
    ...entry,
    shortSummary: entry.shortSummary.trim(),
  };
}

function splitCommaList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function splitLines(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function isRestrictedStatus(status: HistoryAvailability) {
  return status === "Not authorized" || status === "Not disclosed";
}

function Field({
  label,
  htmlFor,
  helper,
  children,
}: {
  label: string;
  htmlFor: string;
  helper?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {helper ? <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">{helper}</p> : null}
    </div>
  );
}

function HistorySectionCard({
  title,
  htmlPrefix,
  value,
  onChange,
  disabled,
  className = "",
}: {
  title: string;
  htmlPrefix: string;
  value: HistorySummaryEntry;
  onChange: <F extends keyof HistorySummaryEntry>(field: F, nextValue: HistorySummaryEntry[F]) => void;
  disabled: boolean;
  className?: string;
}) {
  const restricted = isRestrictedStatus(value.availability);

  return (
    <div className={`rounded-xl border p-4 ${restricted ? "border-amber-500/70 bg-amber-50/60 dark:border-amber-700/70 dark:bg-amber-950/20" : "border-slate-200 bg-slate-950/20 dark:border-slate-800"} ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-base font-semibold text-slate-900 dark:text-slate-50">{title}</p>
          <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">Encode only authorized educational summaries, not full confidential report reproduction.</p>
        </div>
        <Badge variant="warning">Context only</Badge>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <Field label="Availability / Status" htmlFor={`${htmlPrefix}-availability`}>
          <select
            id={`${htmlPrefix}-availability`}
            value={value.availability}
            onChange={(event) => onChange("availability", event.target.value as HistoryAvailability)}
            disabled={disabled}
            className={selectClassName}
          >
            {historyAvailabilities.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Source" htmlFor={`${htmlPrefix}-source`}>
          <select
            id={`${htmlPrefix}-source`}
            value={value.source}
            onChange={(event) => onChange("source", event.target.value as HistorySource)}
            disabled={disabled}
            className={selectClassName}
          >
            {historySources.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Use in recommendation" htmlFor={`${htmlPrefix}-use`}>
          <select
            id={`${htmlPrefix}-use`}
            value={restricted ? "Restricted" : value.useInRecommendation}
            onChange={(event) => onChange("useInRecommendation", event.target.value as HistoryRecommendationUse)}
            disabled={disabled || restricted}
            className={selectClassName}
          >
            {historyRecommendationUses.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="mt-4">
        <Field label="Short authorized summary" htmlFor={`${htmlPrefix}-summary`} helper={restricted ? "This section is restricted. Keep the summary minimal and avoid sensitive detail reproduction." : "Capture only the short authorized details relevant to reading support planning."}>
          <Textarea
            id={`${htmlPrefix}-summary`}
            value={value.shortSummary}
            onChange={(event) => onChange("shortSummary", event.target.value)}
            className="min-h-[110px]"
            placeholder="Short educationally relevant authorized summary"
            disabled={disabled}
          />
        </Field>
      </div>

      <div className={`mt-3 rounded-lg border px-3 py-2 text-xs leading-relaxed ${restricted ? "border-amber-400/70 bg-amber-100/70 text-amber-900 dark:border-amber-700/70 dark:bg-amber-950/40 dark:text-amber-100" : "border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-100"}`}>
        {restricted
          ? "Restricted section. Do not use this as a primary basis for recommendation. If referenced at all, it should remain limited contextual information."
          : "Used only as supporting context. Main basis remains reading assessment, observations, individualized goals, accommodations, and progress data."}
      </div>
    </div>
  );
}

function InlineLegend({ label, value, tone }: { label: string; value: string; tone: "blue" | "rose" | "green" }) {
  const className =
    tone === "blue"
      ? "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-200"
      : tone === "rose"
        ? "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200"
        : "border-green-200 bg-green-50 text-green-800 dark:border-green-900/60 dark:bg-green-950/30 dark:text-green-200";

  return (
    <span className={`rounded-full border px-3 py-1 ${className}`}>
      <span className="font-semibold">{label}:</span> {value}
    </span>
  );
}

const selectClassName =
  "flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 dark:border-slate-700 dark:bg-slate-900 dark:text-white";
