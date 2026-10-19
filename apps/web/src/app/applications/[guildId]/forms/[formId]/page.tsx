"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

type FormData = {
  id: string;
  name: string;
  description: string | null;
  status: string;

  reviewChannelId:
    | string
    | null;

  acceptedRoleId:
    | string
    | null;

  maxApplicationsPerUser:
    number;
};

type Question = {
  id?: string;
  sectionId?: string | null;
  label: string;
  description: string;
  type:
    | "short"
    | "long"
    | "yes_no"
    | "single_select"
    | "multi_select";
  required: boolean;
  options: string[];
  position?: number;
};

type FormSection = {
  id: string;
  guildId: string;
  formId: string;
  title: string;
  description: string | null;
  position: number;
};

type QuestionSettings = {
  questionId: string;
  minLength: number | null;
  maxLength: number | null;
  weight: number;
  conditionalQuestionId: string | null;
  conditionalOperator: string | null;
  conditionalValue:
    | string
    | string[]
    | boolean
    | null;
};

type QuestionSettingsDraft = {
  minLength: number | null;
  maxLength: number | null;
  weight: number;
  conditionalQuestionId: string | null;
  conditionalOperator: string | null;
  conditionalValue: string | null;
};

type GuildChannel = {
  id: string;
  guildId: string;
  name: string;
  type: number;
  parentId:
    | string
    | null;
  position: number;
};

type GuildRole = {
  id: string;
  guildId: string;
  name: string;
  position: number;
  managed: boolean;
};

type GuildResources = {
  channels: GuildChannel[];
  roles: GuildRole[];
};

type AdvancedSettings = {
  applicantNotificationChannelId:
    | string
    | null;

  applicantDmEnabled:
    boolean;

  submitMessage:
    | string
    | null;

  interviewMessage:
    | string
    | null;

  acceptedMessage:
    | string
    | null;

  deniedMessage:
    | string
    | null;

  cooldownHours?:
    number;

  minDiscordAccountAgeDays?:
    number;

  minServerJoinAgeDays?:
    number;

  requiredRoleIds?:
    string[];

  blockedRoleIds?:
    string[];

  reviewerRoleIds?:
    string[];

  scoringEnabled?:
    boolean;

  smartReviewEnabled?:
    boolean;
};

type WorkflowStage = {
  id: string;
  guildId: string;
  formId: string;
  name: string;
  slug: string;
  position: number;
  stageType:
    | "submitted"
    | "review"
    | "interview"
    | "decision"
    | "custom";
  terminal: boolean;
};

type WorkflowEditor = {
  id: string | null;
  name: string;
  stageType:
    WorkflowStage["stageType"];
  terminal: boolean;
};

type Tab =
  | "builder"
  | "workflow"
  | "discord"
  | "requirements"
  | "reviewers"
  | "messages"
  | "branding"
  | "analytics";

const tabs: Array<{
  id: Tab;
  label: string;
  description: string;
}> = [
  {
    id: "builder",
    label: "Builder",
    description:
      "Questions and structure",
  },
  {
    id: "workflow",
    label: "Workflow",
    description:
      "Stages and logic",
  },
  {
    id: "discord",
    label: "Discord",
    description:
      "Channels and roles",
  },
  {
    id: "requirements",
    label: "Requirements",
    description:
      "Eligibility rules",
  },
  {
    id: "reviewers",
    label: "Reviewers",
    description:
      "Access and assignments",
  },
  {
    id: "messages",
    label: "Messages",
    description:
      "Applicant communication",
  },
  {
    id: "branding",
    label: "Branding",
    description:
      "Portal appearance",
  },
  {
    id: "analytics",
    label: "Analytics",
    description:
      "Form performance",
  },
];

function questionLabel(
  question: Question
) {
  return (
    question.label ||
    "Untitled question"
  );
}

function questionTypeLabel(
  type: Question["type"]
) {
  switch (type) {
    case "short":
      return "Short answer";

    case "long":
      return "Long answer";

    case "yes_no":
      return "Yes / No";

    case "single_select":
      return "Single select";

    case "multi_select":
      return "Multi select";
  }
}

export default function ApplicationFormWorkspace({
  params,
}: {
  params: Promise<{
    guildId: string;
    formId: string;
  }>;
}) {
  const [
    route,
    setRoute,
  ] =
    useState<{
      guildId: string;
      formId: string;
    } | null>(
      null
    );

  const [
    activeTab,
    setActiveTab,
  ] =
    useState<Tab>(
      "builder"
    );

  const [
    form,
    setForm,
  ] =
    useState<FormData | null>(
      null
    );

  const [
    questions,
    setQuestions,
  ] =
    useState<Question[]>(
      []
    );

  const [
    sections,
    setSections,
  ] =
    useState<FormSection[]>(
      []
    );

  const [
    sectionEditor,
    setSectionEditor,
  ] =
    useState<{
      id: string | null;
      title: string;
      description: string;
    } | null>(
      null
    );

  const [
    questionSettings,
    setQuestionSettings,
  ] =
    useState<Record<
      string,
      QuestionSettings
    >>({});

  const [
    questionSettingsDraft,
    setQuestionSettingsDraft,
  ] =
    useState<QuestionSettingsDraft>({
      minLength: null,
      maxLength: null,
      weight: 1,
      conditionalQuestionId: null,
      conditionalOperator: null,
      conditionalValue: null,
    });

  const [
    editingQuestionIndex,
    setEditingQuestionIndex,
  ] =
    useState<number | null>(
      null
    );

  const [
    questionDraft,
    setQuestionDraft,
  ] =
    useState<Question | null>(
      null
    );

  const [
    workflowStages,
    setWorkflowStages,
  ] =
    useState<WorkflowStage[]>(
      []
    );

  const [
    workflowEditor,
    setWorkflowEditor,
  ] =
    useState<WorkflowEditor | null>(
      null
    );

  const [
    advanced,
    setAdvanced,
  ] =
    useState<AdvancedSettings>({
      applicantNotificationChannelId:
        null,

      applicantDmEnabled:
        false,

      submitMessage:
        null,

      interviewMessage:
        null,

      acceptedMessage:
        null,

      deniedMessage:
        null,
    });

  const [
    resources,
    setResources,
  ] =
    useState<GuildResources>({
      channels: [],
      roles: [],
    });

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState<
      string | null
    >(null);

  const [
    success,
    setSuccess,
  ] =
    useState<
      string | null
    >(null);

  useEffect(() => {
    void params.then(
      (value) =>
        setRoute(
          value
        )
    );
  }, [params]);

  useEffect(() => {
    if (!route) {
      return;
    }

    const currentRoute =
      route;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const [
          formResponse,
          advancedResponse,
          resourcesResponse,
          sectionsResponse,
          workflowResponse,
        ] =
          await Promise.all([
            fetch(
              `/api/applications/manage/${currentRoute.guildId}?formId=${encodeURIComponent(currentRoute.formId)}`,
              {
                cache:
                  "no-store",
              }
            ),

            fetch(
              `/api/applications/manage/${currentRoute.guildId}?advancedFormId=${encodeURIComponent(currentRoute.formId)}`,
              {
                cache:
                  "no-store",
              }
            ),

            fetch(
              `/api/applications/manage/${currentRoute.guildId}?resources=1`,
              {
                cache:
                  "no-store",
              }
            ),

            fetch(
              `/api/applications/manage/${currentRoute.guildId}?sectionsFormId=${encodeURIComponent(currentRoute.formId)}`,
              {
                cache:
                  "no-store",
              }
            ),

            fetch(
              `/api/applications/manage/${currentRoute.guildId}?workflowFormId=${encodeURIComponent(currentRoute.formId)}`,
              {
                cache:
                  "no-store",
              }
            ),
          ]);

        const [
          formData,
          advancedData,
          resourcesData,
          sectionsData,
          workflowData,
        ] =
          await Promise.all([
            formResponse.json(),
            advancedResponse.json(),
            resourcesResponse.json(),
            sectionsResponse.json(),
            workflowResponse.json(),
          ]);

        if (
          !formResponse.ok
        ) {
          throw new Error(
            formData.error ||
            "Unable to load application form."
          );
        }

        setForm(
          formData.form
        );

        setQuestions(
          formData.questions ??
          []
        );

        if (
          advancedResponse.ok &&
          advancedData.settings
        ) {
          setAdvanced(
            advancedData.settings
          );
        }

        if (
          advancedResponse.ok &&
          Array.isArray(
            advancedData.questionSettings
          )
        ) {
          setQuestionSettings(
            Object.fromEntries(
              advancedData.questionSettings.map(
                (
                  item: QuestionSettings
                ) => [
                  item.questionId,
                  item,
                ]
              )
            )
          );
        }

        if (
          resourcesResponse.ok
        ) {
          setResources({
            channels:
              resourcesData.channels ??
              [],

            roles:
              resourcesData.roles ??
              [],
          });
        }

        if (
          sectionsResponse.ok
        ) {
          setSections(
            sectionsData.sections ??
            []
          );
        }

        if (
          workflowResponse.ok
        ) {
          setWorkflowStages(
            workflowData.stages ??
            []
          );
        }
      } catch (
        loadError
      ) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load form."
        );
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [route]);

  const textChannels =
    useMemo(
      () =>
        resources.channels
          .filter(
            (channel) =>
              channel.type ===
              0
          )
          .sort(
            (a, b) =>
              a.position -
              b.position
          ),
      [
        resources.channels,
      ]
    );

  const selectableRoles =
    useMemo(
      () =>
        resources.roles
          .filter(
            (role) =>
              !role.managed
          )
          .sort(
            (a, b) =>
              b.position -
              a.position
          ),
      [
        resources.roles,
      ]
    );

  async function saveAction(
    body: Record<
      string,
      unknown
    >
  ) {
    if (!route) {
      return false;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response =
        await fetch(
          `/api/applications/manage/${route.guildId}`,
          {
            method:
              "POST",

            headers: {
              "content-type":
                "application/json",
            },

            body:
              JSON.stringify(
                body
              ),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
          "Unable to save changes."
        );
      }

      setSuccess(
        "Changes saved."
      );

      return true;
    } catch (
      saveError
    ) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save changes."
      );

      return false;
    } finally {
      setSaving(false);
    }
  }

  async function reloadWorkflow() {
    const currentRoute =
      route;

    const currentForm =
      form;

    if (
      !currentRoute ||
      !currentForm
    ) {
      return;
    }

    const response =
      await fetch(
        `/api/applications/manage/${currentRoute.guildId}?workflowFormId=${encodeURIComponent(currentForm.id)}`,
        {
          cache:
            "no-store",
        }
      );

    const data =
      await response.json();

    if (response.ok) {
      setWorkflowStages(
        data.stages ??
        []
      );
    }
  }

  function openNewWorkflowStage() {
    setWorkflowEditor({
      id: null,
      name: "",
      stageType:
        "review",
      terminal:
        false,
    });
  }

  function openWorkflowStage(
    stage: WorkflowStage
  ) {
    setWorkflowEditor({
      id:
        stage.id,

      name:
        stage.name,

      stageType:
        stage.stageType,

      terminal:
        stage.terminal,
    });
  }

  async function saveWorkflowStage() {
    const currentForm =
      form;

    const editor =
      workflowEditor;

    if (
      !currentForm ||
      !editor
    ) {
      return;
    }

    if (
      !editor.name.trim()
    ) {
      setError(
        "Workflow stage name is required."
      );

      return;
    }

    const saved =
      await saveAction(
        editor.id
          ? {
              action:
                "workflow-stage-save",

              formId:
                currentForm.id,

              stageId:
                editor.id,

              stage: {
                name:
                  editor.name,

                stageType:
                  editor.stageType,

                terminal:
                  editor.terminal,
              },
            }
          : {
              action:
                "workflow-stage-create",

              formId:
                currentForm.id,

              name:
                editor.name,

              stageType:
                editor.stageType,

              terminal:
                editor.terminal,
            }
      );

    if (!saved) {
      return;
    }

    await reloadWorkflow();

    setWorkflowEditor(
      null
    );
  }

  async function deleteWorkflowStage(
    stage: WorkflowStage
  ) {
    const currentForm =
      form;

    if (!currentForm) {
      return;
    }

    if (
      !window.confirm(
        `Delete "${stage.name}" from this workflow?`
      )
    ) {
      return;
    }

    const deleted =
      await saveAction({
        action:
          "workflow-stage-delete",

        formId:
          currentForm.id,

        stageId:
          stage.id,
      });

    if (deleted) {
      await reloadWorkflow();
    }
  }

  async function moveWorkflowStage(
    index: number,
    direction: -1 | 1
  ) {
    const currentForm =
      form;

    if (!currentForm) {
      return;
    }

    const target =
      index +
      direction;

    if (
      target < 0 ||
      target >=
        workflowStages.length
    ) {
      return;
    }

    const previous =
      [...workflowStages];

    const next =
      [...workflowStages];

    [
      next[index],
      next[target],
    ] = [
      next[target],
      next[index],
    ];

    setWorkflowStages(
      next.map(
        (
          stage,
          position
        ) => ({
          ...stage,
          position,
        })
      )
    );

    const saved =
      await saveAction({
        action:
          "workflow-reorder",

        formId:
          currentForm.id,

        stageIds:
          next.map(
            (stage) =>
              stage.id
          ),
      });

    if (!saved) {
      setWorkflowStages(
        previous
      );
    }
  }

  async function createRecommendedWorkflow() {
    const currentForm =
      form;

    if (!currentForm) {
      return;
    }

    if (
      workflowStages.length &&
      !window.confirm(
        "This will add recommended stages to your existing workflow. Continue?"
      )
    ) {
      return;
    }

    const recommended: Array<{
      name: string;
      stageType:
        WorkflowStage["stageType"];
      terminal: boolean;
    }> = [
      {
        name:
          "Submitted",
        stageType:
          "submitted",
        terminal:
          false,
      },
      {
        name:
          "Initial Review",
        stageType:
          "review",
        terminal:
          false,
      },
      {
        name:
          "Interview",
        stageType:
          "interview",
        terminal:
          false,
      },
      {
        name:
          "Final Review",
        stageType:
          "review",
        terminal:
          false,
      },
      {
        name:
          "Accepted",
        stageType:
          "decision",
        terminal:
          true,
      },
      {
        name:
          "Denied",
        stageType:
          "decision",
        terminal:
          true,
      },
    ];

    for (
      const stage
      of recommended
    ) {
      const saved =
        await saveAction({
          action:
            "workflow-stage-create",

          formId:
            currentForm.id,

          ...stage,
        });

      if (!saved) {
        await reloadWorkflow();
        return;
      }
    }

    await reloadWorkflow();

    setSuccess(
      "Recommended workflow created."
    );
  }

  function openNewSection() {
    setSectionEditor({
      id: null,
      title: "",
      description: "",
    });
  }

  function openSectionEditor(
    section: FormSection
  ) {
    setSectionEditor({
      id:
        section.id,

      title:
        section.title,

      description:
        section.description ??
        "",
    });
  }

  async function saveSection() {
    if (
      !form ||
      !sectionEditor
    ) {
      return;
    }

    if (
      !sectionEditor.title.trim()
    ) {
      setError(
        "Section title is required."
      );

      return;
    }

    const creating =
      !sectionEditor.id;

    const saved =
      await saveAction(
        creating
          ? {
              action:
                "section-create",

              formId:
                form.id,

              title:
                sectionEditor.title,

              description:
                sectionEditor.description,
            }
          : {
              action:
                "section-save",

              formId:
                form.id,

              sectionId:
                sectionEditor.id,

              section: {
                title:
                  sectionEditor.title,

                description:
                  sectionEditor.description,
              },
            }
      );

    if (!saved) {
      return;
    }

    const response =
      await fetch(
        `/api/applications/manage/${route!.guildId}?sectionsFormId=${encodeURIComponent(form.id)}`,
        {
          cache:
            "no-store",
        }
      );

    const data =
      await response.json();

    if (response.ok) {
      setSections(
        data.sections ??
        []
      );
    }

    setSectionEditor(
      null
    );
  }

  async function deleteSection(
    section: FormSection
  ) {
    const currentForm =
      form;

    if (!currentForm) {
      return;
    }

    if (
      !window.confirm(
        `Delete "${section.title}"?`
      )
    ) {
      return;
    }

    const deleted =
      await saveAction({
        action:
          "section-delete",

        formId:
          currentForm.id,

        sectionId:
          section.id,
      });

    if (deleted) {
      setSections(
        (
          current
        ) =>
          current.filter(
            (item) =>
              item.id !==
              section.id
          )
      );
    }
  }

  async function moveSection(
    index: number,
    direction: -1 | 1
  ) {
    const currentForm =
      form;

    if (!currentForm) {
      return;
    }

    const target =
      index + direction;

    if (
      target < 0 ||
      target >=
        sections.length
    ) {
      return;
    }

    const next =
      [...sections];

    [
      next[index],
      next[target],
    ] = [
      next[target],
      next[index],
    ];

    setSections(
      next.map(
        (
          section,
          position
        ) => ({
          ...section,
          position,
        })
      )
    );

    const saved =
      await saveAction({
        action:
          "sections-reorder",

        formId:
          currentForm.id,

        sectionIds:
          next.map(
            (section) =>
              section.id
          ),
      });

    if (!saved) {
      setSections(
        sections
      );
    }
  }

  function questionsForSection(
    sectionId: string | null
  ) {
    return questions.filter(
      (question) =>
        (question.sectionId ??
          null) ===
        sectionId
    );
  }

  function openNewQuestionForSection(
    sectionId: string | null
  ) {
    setEditingQuestionIndex(
      questions.length
    );

    setQuestionDraft({
      sectionId,

      label: "",
      description: "",
      type: "short",
      required: true,
      options: [],
    });

    setQuestionSettingsDraft({
      minLength: null,
      maxLength: null,
      weight: 1,
      conditionalQuestionId: null,
      conditionalOperator: null,
      conditionalValue: null,
    });
  }

  function moveQuestionWithinSection(
    question: Question,
    direction: -1 | 1
  ) {
    const sectionId =
      question.sectionId ??
      null;

    const grouped =
      questions.filter(
        (item) =>
          (item.sectionId ??
            null) ===
          sectionId
      );

    const groupedIndex =
      grouped.indexOf(
        question
      );

    const targetGroupedIndex =
      groupedIndex +
      direction;

    if (
      groupedIndex === -1 ||
      targetGroupedIndex < 0 ||
      targetGroupedIndex >=
        grouped.length
    ) {
      return;
    }

    const targetQuestion =
      grouped[
        targetGroupedIndex
      ];

    const currentIndex =
      questions.indexOf(
        question
      );

    const targetIndex =
      questions.indexOf(
        targetQuestion
      );

    if (
      currentIndex === -1 ||
      targetIndex === -1
    ) {
      return;
    }

    setQuestions(
      (
        current
      ) => {
        const next =
          [...current];

        [
          next[currentIndex],
          next[targetIndex],
        ] = [
          next[targetIndex],
          next[currentIndex],
        ];

        return next.map(
          (
            item,
            position
          ) => ({
            ...item,
            position,
          })
        );
      }
    );
  }

  function openNewQuestion() {
    setEditingQuestionIndex(
      questions.length
    );

    setQuestionDraft({
      label: "",
      description: "",
      sectionId:
        sections[0]?.id ??
        null,
      type: "short",
      required: true,
      options: [],
    });

    setQuestionSettingsDraft({
      minLength: null,
      maxLength: null,
      weight: 1,
      conditionalQuestionId: null,
      conditionalOperator: null,
      conditionalValue: null,
    });
  }

  function openQuestion(
    index: number
  ) {
    const question =
      questions[index];

    setEditingQuestionIndex(
      index
    );

    setQuestionDraft({
      ...question,

      options: [
        ...(question.options ??
          []),
      ],
    });

    const settings =
      question.id
        ? questionSettings[
            question.id
          ]
        : undefined;

    setQuestionSettingsDraft({
      minLength:
        settings?.minLength ??
        null,

      maxLength:
        settings?.maxLength ??
        null,

      weight:
        settings?.weight ??
        1,

      conditionalQuestionId:
        settings?.conditionalQuestionId ??
        null,

      conditionalOperator:
        settings?.conditionalOperator ??
        null,

      conditionalValue:
        typeof settings?.conditionalValue ===
        "string"
          ? settings.conditionalValue
          : settings?.conditionalValue ===
              true
            ? "true"
            : settings?.conditionalValue ===
                false
              ? "false"
              : null,
    });
  }

  function closeQuestionEditor() {
    setEditingQuestionIndex(
      null
    );

    setQuestionDraft(
      null
    );
  }

  function applyQuestionDraft() {
    if (
      editingQuestionIndex ===
        null ||
      !questionDraft
    ) {
      return;
    }

    if (
      !questionDraft.label.trim()
    ) {
      setError(
        "Question text is required."
      );

      return;
    }

    const next =
      [...questions];

    const normalized: Question = {
      ...questionDraft,

      label:
        questionDraft.label.trim(),

      description:
        questionDraft.description.trim(),

      options:
        questionDraft.options
          .map(
            (option) =>
              option.trim()
          )
          .filter(Boolean),
    };

    if (
      editingQuestionIndex >=
      next.length
    ) {
      next.push(
        normalized
      );
    } else {
      next[
        editingQuestionIndex
      ] =
        normalized;
    }

    const positioned =
      next.map(
        (
          question,
          position
        ) => ({
          ...question,
          position,
        })
      );

    setQuestions(
      positioned
    );

    const savedQuestion =
      positioned[
        editingQuestionIndex
      ];

    if (
      savedQuestion?.id
    ) {
      void saveCurrentQuestionSettings(
        savedQuestion
      );
    }

    closeQuestionEditor();
    setError(null);
  }

  async function saveCurrentQuestionSettings(
    question: Question
  ) {
    if (
      !form ||
      !question.id
    ) {
      return true;
    }

    const saved =
      await saveAction({
        action:
          "question-settings-save",

        formId:
          form.id,

        questionId:
          question.id,

        settings: {
          minLength:
            questionSettingsDraft.minLength,

          maxLength:
            questionSettingsDraft.maxLength,

          weight:
            questionSettingsDraft.weight,

          conditionalQuestionId:
            questionSettingsDraft.conditionalQuestionId,

          conditionalOperator:
            questionSettingsDraft.conditionalOperator,

          conditionalValue:
            questionSettingsDraft.conditionalValue,
        },
      });

    if (saved) {
      setQuestionSettings(
        (
          current
        ) => ({
          ...current,

          [question.id!]: {
            questionId:
              question.id!,

            ...questionSettingsDraft,
          },
        })
      );
    }

    return saved;
  }

  function duplicateQuestion(
    index: number
  ) {
    const source =
      questions[index];

    const next =
      [...questions];

    next.splice(
      index + 1,
      0,
      {
        ...source,

        id:
          undefined,

        label:
          `${source.label} Copy`,

        options: [
          ...source.options,
        ],
      }
    );

    setQuestions(
      next.map(
        (
          question,
          position
        ) => ({
          ...question,
          position,
        })
      )
    );
  }

  function deleteQuestion(
    index: number
  ) {
    if (
      !window.confirm(
        "Delete this question?"
      )
    ) {
      return;
    }

    const next =
      questions.filter(
        (
          _,
          questionIndex
        ) =>
          questionIndex !==
          index
      );

    setQuestions(
      next.map(
        (
          question,
          position
        ) => ({
          ...question,
          position,
        })
      )
    );
  }

  function moveQuestion(
    index: number,
    direction: -1 | 1
  ) {
    const target =
      index + direction;

    if (
      target < 0 ||
      target >=
        questions.length
    ) {
      return;
    }

    const next =
      [...questions];

    const current =
      next[index];

    next[index] =
      next[target];

    next[target] =
      current;

    setQuestions(
      next.map(
        (
          question,
          position
        ) => ({
          ...question,
          position,
        })
      )
    );
  }

  async function saveQuestions() {
    const currentForm =
      form;

    const currentRoute =
      route;

    if (
      !currentForm ||
      !currentRoute
    ) {
      return;
    }

    const saved =
      await saveAction({
        action:
          "questions-save",

        formId:
          currentForm.id,

        questions:
          questions.map(
            (
              question,
              position
            ) => ({
              ...question,
              position,
            })
          ),
      });

    if (!saved) {
      return;
    }

    const response =
      await fetch(
        `/api/applications/manage/${currentRoute.guildId}?formId=${encodeURIComponent(currentForm.id)}`,
        {
          cache:
            "no-store",
        }
      );

    const data =
      await response.json();

    if (
      response.ok &&
      Array.isArray(
        data.questions
      )
    ) {
      setQuestions(
        data.questions
      );
    }
  }


  async function saveBasics() {
    if (!form) {
      return;
    }

    await saveAction({
      action:
        "form-save",

      formId:
        form.id,

      form: {
        name:
          form.name,

        description:
          form.description,

        status:
          form.status,

        maxApplicationsPerUser:
          form.maxApplicationsPerUser,
      },
    });
  }

  async function saveDiscord() {
    if (!form) {
      return;
    }

    const formSaved =
      await saveAction({
        action:
          "form-save",

        formId:
          form.id,

        form: {
          reviewChannelId:
            form.reviewChannelId,

          acceptedRoleId:
            form.acceptedRoleId,
        },
      });

    if (!formSaved) {
      return;
    }

    await saveAction({
      action:
        "advanced-save",

      formId:
        form.id,

      settings: {
        applicantNotificationChannelId:
          advanced.applicantNotificationChannelId,

        applicantDmEnabled:
          false,
      },
    });
  }

  if (
    loading ||
    !route
  ) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#07080b] text-white">
        <div className="text-sm text-zinc-600">
          Loading form workspace…
        </div>
      </main>
    );
  }

  if (
    !form
  ) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#07080b] text-white">
        <div className="max-w-md rounded-2xl border border-red-400/10 bg-red-400/[0.04] p-6 text-center">
          <div className="font-semibold">
            Application unavailable
          </div>

          <p className="mt-2 text-sm text-zinc-500">
            {error ??
              "This form could not be loaded."}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#07080b] text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[20%] top-[-260px] h-[560px] w-[560px] rounded-full bg-violet-500/[0.08] blur-[150px]" />

        <div className="absolute right-[-160px] top-[30%] h-[500px] w-[500px] rounded-full bg-sky-500/[0.07] blur-[150px]" />
      </div>

      <div className="relative min-h-screen">
        <header className="sticky top-0 z-40 border-b border-white/[0.05] bg-[#07080b]/80 backdrop-blur-xl">
          <div className="flex min-h-20 items-center justify-between gap-4 px-5 md:px-8">
            <div className="flex min-w-0 items-center gap-4">
              <a
                href={`/applications/${route.guildId}/workspace`}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/[0.07] bg-white/[0.03] text-zinc-400 transition hover:bg-white/[0.06] hover:text-white"
              >
                ←
              </a>

              <div className="min-w-0">
                <div className="truncate text-lg font-semibold tracking-tight">
                  {
                    form.name
                  }
                </div>

                <div className="mt-1 flex items-center gap-2 text-xs text-zinc-600">
                  <span>
                    Application Form
                  </span>

                  <span>
                    ·
                  </span>

                  <span className="capitalize">
                    {
                      form.status
                    }
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={`/apply/${route.guildId}/${form.id}`}
                target="_blank"
                className="hidden rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-zinc-300 transition hover:bg-white/[0.06] md:block"
              >
                Preview
              </a>

              <button
                onClick={() => {
                  if (
                    activeTab ===
                    "discord"
                  ) {
                    void saveDiscord();

                    return;
                  }

                  if (
                    activeTab ===
                    "builder"
                  ) {
                    void Promise.all([
                      saveBasics(),
                      saveQuestions(),
                    ]);

                    return;
                  }

                  void saveBasics();
                }}
                disabled={
                  saving
                }
                className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:opacity-50"
              >
                {saving
                  ? "Saving…"
                  : "Save Changes"}
              </button>
            </div>
          </div>
        </header>

        <div className="mx-auto flex max-w-[1700px]">
          <aside className="hidden w-[250px] shrink-0 border-r border-white/[0.05] px-4 py-7 lg:block">
            <div className="px-3 text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-700">
              Configure
            </div>

            <div className="mt-4 space-y-1">
              {tabs.map(
                (tab) => {
                  const active =
                    activeTab ===
                    tab.id;

                  return (
                    <button
                      key={
                        tab.id
                      }
                      onClick={() =>
                        setActiveTab(
                          tab.id
                        )
                      }
                      className={[
                        "w-full rounded-xl px-3 py-2.5 text-left transition",
                        active
                          ? "border border-white/[0.07] bg-white/[0.05]"
                          : "border border-transparent hover:bg-white/[0.025]",
                      ].join(" ")}
                    >
                      <div
                        className={
                          active
                            ? "text-sm font-medium text-white"
                            : "text-sm font-medium text-zinc-500"
                        }
                      >
                        {
                          tab.label
                        }
                      </div>

                      <div className="mt-0.5 text-[11px] text-zinc-700">
                        {
                          tab.description
                        }
                      </div>
                    </button>
                  );
                }
              )}
            </div>
          </aside>

          <section className="min-w-0 flex-1 p-5 md:p-8 xl:p-10">
            <div className="mx-auto max-w-[1200px]">
              {error ? (
                <div className="mb-5 rounded-xl border border-red-400/15 bg-red-400/[0.05] px-4 py-3 text-sm text-red-300">
                  {error}
                </div>
              ) : null}

              {success ? (
                <div className="mb-5 rounded-xl border border-emerald-400/15 bg-emerald-400/[0.05] px-4 py-3 text-sm text-emerald-300">
                  {
                    success
                  }
                </div>
              ) : null}

              <div className="overflow-x-auto pb-4 lg:hidden">
                <div className="flex min-w-max gap-2">
                  {tabs.map(
                    (tab) => (
                      <button
                        key={
                          tab.id
                        }
                        onClick={() =>
                          setActiveTab(
                            tab.id
                          )
                        }
                        className={[
                          "rounded-xl border px-3 py-2 text-sm",
                          activeTab ===
                          tab.id
                            ? "border-white/[0.1] bg-white/[0.07] text-white"
                            : "border-white/[0.05] bg-white/[0.02] text-zinc-500",
                        ].join(" ")}
                      >
                        {
                          tab.label
                        }
                      </button>
                    )
                  )}
                </div>
              </div>

              {activeTab ===
              "builder" ? (
                <>
                  <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
                    <div>
                      <p className="text-sm text-zinc-500">
                        Form Builder
                      </p>

                      <h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em] md:text-4xl">
                        Build the applicant experience.
                      </h1>

                      <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600">
                        Configure the form identity,
                        questions and structure applicants
                        interact with.
                      </p>
                    </div>

                    <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] px-4 py-3 text-sm text-zinc-500">
                      {
                        questions.length
                      }{" "}
                      questions
                    </div>
                  </div>

                  <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_380px]">
                    <div className="space-y-4">
                      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <h2 className="font-semibold">
                              Sections
                            </h2>

                            <p className="mt-1 text-xs text-zinc-600">
                              Organize your application into clear stages.
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={
                              openNewSection
                            }
                            className="rounded-xl border border-violet-400/15 bg-violet-400/[0.06] px-3 py-2 text-sm font-medium text-violet-200 transition hover:bg-violet-400/[0.1]"
                          >
                            + Add Section
                          </button>
                        </div>

                        {sections.length ? (
                          <div className="mt-5 space-y-3">
                            {sections.map(
                              (
                                section,
                                index
                              ) => (
                                <div
                                  key={
                                    section.id
                                  }
                                  className="group rounded-2xl border border-white/[0.055] bg-[#0a0b0f] p-4 transition hover:border-white/[0.1]"
                                >
                                  <div className="flex items-start gap-4">
                                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/[0.05] bg-white/[0.035] text-xs font-semibold text-zinc-600">
                                      {index +
                                        1}
                                    </div>

                                    <div className="min-w-0 flex-1">
                                      <div className="font-medium text-zinc-200">
                                        {
                                          section.title
                                        }
                                      </div>

                                      <p className="mt-1.5 text-xs leading-5 text-zinc-600">
                                        {section.description ||
                                          "No section description"}
                                      </p>
                                    </div>

                                    <div className="flex shrink-0 items-center gap-1 opacity-60 transition group-hover:opacity-100">
                                      <button
                                        type="button"
                                        disabled={
                                          index ===
                                          0
                                        }
                                        onClick={() =>
                                          void moveSection(
                                            index,
                                            -1
                                          )
                                        }
                                        className="grid h-8 w-8 place-items-center rounded-lg text-zinc-600 transition hover:bg-white/[0.05] hover:text-white disabled:opacity-20"
                                      >
                                        ↑
                                      </button>

                                      <button
                                        type="button"
                                        disabled={
                                          index ===
                                          sections.length -
                                            1
                                        }
                                        onClick={() =>
                                          void moveSection(
                                            index,
                                            1
                                          )
                                        }
                                        className="grid h-8 w-8 place-items-center rounded-lg text-zinc-600 transition hover:bg-white/[0.05] hover:text-white disabled:opacity-20"
                                      >
                                        ↓
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() =>
                                          openSectionEditor(
                                            section
                                          )
                                        }
                                        className="rounded-lg px-2.5 py-2 text-xs text-zinc-500 transition hover:bg-white/[0.05] hover:text-white"
                                      >
                                        Edit
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() =>
                                          void deleteSection(
                                            section
                                          )
                                        }
                                        className="rounded-lg px-2.5 py-2 text-xs text-red-400/60 transition hover:bg-red-400/[0.06] hover:text-red-300"
                                      >
                                        Delete
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={
                              openNewSection
                            }
                            className="mt-5 w-full rounded-2xl border border-dashed border-white/[0.07] px-5 py-10 text-center transition hover:border-violet-400/20 hover:bg-violet-400/[0.02]"
                          >
                            <div className="text-sm font-medium text-zinc-400">
                              Create your first section
                            </div>

                            <div className="mt-2 text-xs text-zinc-700">
                              Example: Basic Information, Experience, Scenario Questions
                            </div>
                          </button>
                        )}
                      </div>

                      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
                        <div className="flex items-center justify-between">
                          <div>
                            <h2 className="font-semibold">
                              Questions
                            </h2>

                            <p className="mt-1 text-xs text-zinc-600">
                              Applicant form structure
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={
                              openNewQuestion
                            }
                            className="rounded-xl border border-violet-400/15 bg-violet-400/[0.06] px-3 py-2 text-sm font-medium text-violet-200 transition hover:bg-violet-400/[0.1]"
                          >
                            + Add Question
                          </button>
                        </div>

                        <div className="mt-5 space-y-3">
                          {questions.length ? (
                            questions
                              .map(
                                (
                                  question,
                                  index
                                ) => (
                                  <div
                                    key={
                                      question.id ??
                                      `${index}-${question.label}`
                                    }
                                    className="group rounded-2xl border border-white/[0.055] bg-[#0a0b0f] p-4 transition hover:border-white/[0.11] hover:bg-white/[0.025]"
                                  >
                                    <div className="flex items-start gap-4">
                                      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/[0.05] bg-white/[0.035] text-xs font-semibold text-zinc-600">
                                        {index +
                                          1}
                                      </div>

                                      <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                          <div className="font-medium text-zinc-200">
                                            {questionLabel(
                                              question
                                            )}
                                          </div>

                                          {question.required ? (
                                            <span className="rounded-full border border-violet-400/15 bg-violet-400/[0.06] px-2 py-0.5 text-[10px] font-medium text-violet-300">
                                              Required
                                            </span>
                                          ) : null}
                                        </div>

                                        {question.description ? (
                                          <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-zinc-600">
                                            {
                                              question.description
                                            }
                                          </p>
                                        ) : null}

                                        <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-zinc-700">
                                          <span className="rounded-lg bg-white/[0.035] px-2 py-1">
                                            {questionTypeLabel(
                                              question.type
                                            )}
                                          </span>

                                          {question.sectionId ? (
                                            <span className="rounded-lg border border-violet-400/10 bg-violet-400/[0.04] px-2 py-1 text-violet-300/70">
                                              {sections.find(
                                                (section) =>
                                                  section.id ===
                                                  question.sectionId
                                              )?.title ??
                                                "Section"}
                                            </span>
                                          ) : null}

                                          {(question.type ===
                                            "single_select" ||
                                            question.type ===
                                              "multi_select") && (
                                            <span>
                                              {
                                                question.options.length
                                              }{" "}
                                              options
                                            </span>
                                          )}

                                          {question.id &&
                                          questionSettings[
                                            question.id
                                          ]?.weight >
                                            1 ? (
                                            <span>
                                              Weight{" "}
                                              {
                                                questionSettings[
                                                  question.id
                                                ].weight
                                              }×
                                            </span>
                                          ) : null}

                                          {question.id &&
                                          questionSettings[
                                            question.id
                                          ]?.conditionalQuestionId ? (
                                            <span className="text-violet-400/70">
                                              Conditional
                                            </span>
                                          ) : null}

                                          {question.id &&
                                          (questionSettings[
                                            question.id
                                          ]?.minLength !==
                                            null ||
                                            questionSettings[
                                              question.id
                                            ]?.maxLength !==
                                              null) ? (
                                            <span>
                                              Validated
                                            </span>
                                          ) : null}
                                        </div>
                                      </div>

                                      <div className="flex shrink-0 items-center gap-1 opacity-60 transition group-hover:opacity-100">
                                        <button
                                          type="button"
                                          disabled={
                                            index ===
                                            0
                                          }
                                          onClick={() =>
                                            moveQuestion(
                                              index,
                                              -1
                                            )
                                          }
                                          className="grid h-8 w-8 place-items-center rounded-lg text-zinc-600 transition hover:bg-white/[0.05] hover:text-white disabled:opacity-20"
                                          title="Move up"
                                        >
                                          ↑
                                        </button>

                                        <button
                                          type="button"
                                          disabled={
                                            index ===
                                            questions.length -
                                              1
                                          }
                                          onClick={() =>
                                            moveQuestion(
                                              index,
                                              1
                                            )
                                          }
                                          className="grid h-8 w-8 place-items-center rounded-lg text-zinc-600 transition hover:bg-white/[0.05] hover:text-white disabled:opacity-20"
                                          title="Move down"
                                        >
                                          ↓
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() =>
                                            duplicateQuestion(
                                              index
                                            )
                                          }
                                          className="rounded-lg px-2.5 py-2 text-xs text-zinc-600 transition hover:bg-white/[0.05] hover:text-white"
                                        >
                                          Duplicate
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() =>
                                            openQuestion(
                                              index
                                            )
                                          }
                                          className="rounded-lg px-2.5 py-2 text-xs text-zinc-500 transition hover:bg-white/[0.05] hover:text-white"
                                        >
                                          Edit
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() =>
                                            deleteQuestion(
                                              index
                                            )
                                          }
                                          className="rounded-lg px-2.5 py-2 text-xs text-red-400/60 transition hover:bg-red-400/[0.06] hover:text-red-300"
                                        >
                                          Delete
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                )
                              )
                          ) : (
                            <div className="rounded-xl border border-dashed border-white/[0.07] px-5 py-14 text-center">
                              <div className="text-sm font-medium text-zinc-400">
                                Start building your application
                              </div>

                              <div className="mt-2 text-xs text-zinc-700">
                                Add your first question to begin.
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-5">
                      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
                        <h2 className="font-semibold">
                          Form Details
                        </h2>

                        <label className="mt-5 block">
                          <span className="text-xs font-medium text-zinc-500">
                            Name
                          </span>

                          <input
                            value={
                              form.name
                            }
                            onChange={(event) =>
                              setForm({
                                ...form,

                                name:
                                  event.target.value,
                              })
                            }
                            className="mt-2 w-full rounded-xl border border-white/[0.07] bg-[#090a0e] px-4 py-3 text-sm outline-none transition focus:border-violet-400/30"
                          />
                        </label>

                        <label className="mt-4 block">
                          <span className="text-xs font-medium text-zinc-500">
                            Description
                          </span>

                          <textarea
                            value={
                              form.description ??
                              ""
                            }
                            onChange={(event) =>
                              setForm({
                                ...form,

                                description:
                                  event.target.value ||
                                  null,
                              })
                            }
                            className="mt-2 min-h-28 w-full rounded-xl border border-white/[0.07] bg-[#090a0e] px-4 py-3 text-sm outline-none transition focus:border-violet-400/30"
                          />
                        </label>

                        <label className="mt-4 block">
                          <span className="text-xs font-medium text-zinc-500">
                            Status
                          </span>

                          <select
                            value={
                              form.status
                            }
                            onChange={(event) =>
                              setForm({
                                ...form,

                                status:
                                  event.target.value,
                              })
                            }
                            className="mt-2 w-full rounded-xl border border-white/[0.07] bg-[#090a0e] px-4 py-3 text-sm"
                          >
                            <option value="draft">
                              Draft
                            </option>

                            <option value="open">
                              Open
                            </option>

                            <option value="closed">
                              Closed
                            </option>

                            <option value="archived">
                              Archived
                            </option>
                          </select>
                        </label>

                        <label className="mt-4 block">
                          <span className="text-xs font-medium text-zinc-500">
                            Applications per user
                          </span>

                          <input
                            type="number"
                            min="1"
                            value={
                              form.maxApplicationsPerUser
                            }
                            onChange={(event) =>
                              setForm({
                                ...form,

                                maxApplicationsPerUser:
                                  Math.max(
                                    1,
                                    Number(
                                      event.target.value
                                    ) ||
                                      1
                                  ),
                              })
                            }
                            className="mt-2 w-full rounded-xl border border-white/[0.07] bg-[#090a0e] px-4 py-3 text-sm"
                          />
                        </label>
                      </div>

                      <div className="rounded-2xl border border-violet-400/10 bg-gradient-to-br from-violet-400/[0.06] to-transparent p-5">
                        <div className="text-xs font-medium text-violet-300">
                          Live Preview
                        </div>

                        <p className="mt-2 text-sm leading-6 text-zinc-500">
                          Preview exactly what applicants will see before publishing.
                        </p>

                        <a
                          href={`/apply/${route.guildId}/${form.id}`}
                          target="_blank"
                          className="mt-4 inline-block text-sm font-medium text-white"
                        >
                          Open applicant view →
                        </a>
                      </div>
                    </div>
                  </div>
                </>
              ) : null}

              {activeTab ===
              "discord" ? (
                <>
                  <div>
                    <p className="text-sm text-zinc-500">
                      Discord Integration
                    </p>

                    <h1 className="mt-2 text-3xl font-semibold tracking-tight">
                      Connect the workflow to Discord.
                    </h1>

                    <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600">
                      Choose where reviews happen,
                      where applicants receive updates
                      and what role accepted users get.
                    </p>
                  </div>

                  <div className="mt-8 grid gap-5 lg:grid-cols-2">
                    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
                      <div className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-700">
                        Staff
                      </div>

                      <h2 className="mt-2 font-semibold">
                        Review Channel
                      </h2>

                      <p className="mt-1 text-xs leading-5 text-zinc-600">
                        New applications are posted here for staff review.
                      </p>

                      <select
                        value={
                          form.reviewChannelId ??
                          ""
                        }
                        onChange={(event) =>
                          setForm({
                            ...form,

                            reviewChannelId:
                              event.target.value ||
                              null,
                          })
                        }
                        className="mt-5 w-full rounded-xl border border-white/[0.07] bg-[#090a0e] px-4 py-3 text-sm"
                      >
                        <option value="">
                          No review channel
                        </option>

                        {textChannels.map(
                          (
                            channel
                          ) => (
                            <option
                              key={
                                channel.id
                              }
                              value={
                                channel.id
                              }
                            >
                              #{channel.name}
                            </option>
                          )
                        )}
                      </select>
                    </div>

                    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
                      <div className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-700">
                        Applicants
                      </div>

                      <h2 className="mt-2 font-semibold">
                        Notification Channel
                      </h2>

                      <p className="mt-1 text-xs leading-5 text-zinc-600">
                        UtilityX pings applicants here when their application changes.
                      </p>

                      <select
                        value={
                          advanced.applicantNotificationChannelId ??
                          ""
                        }
                        onChange={(event) =>
                          setAdvanced({
                            ...advanced,

                            applicantNotificationChannelId:
                              event.target.value ||
                              null,
                          })
                        }
                        className="mt-5 w-full rounded-xl border border-white/[0.07] bg-[#090a0e] px-4 py-3 text-sm"
                      >
                        <option value="">
                          Notifications disabled
                        </option>

                        {textChannels.map(
                          (
                            channel
                          ) => (
                            <option
                              key={
                                channel.id
                              }
                              value={
                                channel.id
                              }
                            >
                              #{channel.name}
                            </option>
                          )
                        )}
                      </select>
                    </div>

                    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 lg:col-span-2">
                      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <div className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-700">
                            Acceptance
                          </div>

                          <h2 className="mt-2 font-semibold">
                            Accepted Role
                          </h2>

                          <p className="mt-1 text-xs text-zinc-600">
                            Automatically assign this role when an applicant is accepted.
                          </p>
                        </div>

                        <select
                          value={
                            form.acceptedRoleId ??
                            ""
                          }
                          onChange={(event) =>
                            setForm({
                              ...form,

                              acceptedRoleId:
                                event.target.value ||
                                null,
                            })
                          }
                          className="w-full rounded-xl border border-white/[0.07] bg-[#090a0e] px-4 py-3 text-sm lg:max-w-sm"
                        >
                          <option value="">
                            No automatic role
                          </option>

                          {selectableRoles.map(
                            (
                              role
                            ) => (
                              <option
                                key={
                                  role.id
                                }
                                value={
                                  role.id
                                }
                              >
                                @{role.name}
                              </option>
                            )
                          )}
                        </select>
                      </div>
                    </div>
                  </div>
                </>
              ) : null}

              {activeTab ===
              "workflow" ? (
                <>
                  <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
                    <div>
                      <p className="text-sm text-zinc-500">
                        Application Workflow
                      </p>

                      <h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em] md:text-4xl">
                        Design the review pipeline.
                      </h1>

                      <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600">
                        Build the stages an application moves through from submission to final decision.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {!workflowStages.length ? (
                        <button
                          type="button"
                          onClick={() =>
                            void createRecommendedWorkflow()
                          }
                          className="rounded-xl border border-violet-400/15 bg-violet-400/[0.06] px-4 py-2.5 text-sm font-medium text-violet-200 transition hover:bg-violet-400/[0.1]"
                        >
                          ✦ Recommended Workflow
                        </button>
                      ) : null}

                      <button
                        type="button"
                        onClick={
                          openNewWorkflowStage
                        }
                        className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black"
                      >
                        + Add Stage
                      </button>
                    </div>
                  </div>

                  <div className="mt-8 rounded-2xl border border-white/[0.06] bg-white/[0.018] p-5 md:p-6">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <h2 className="font-semibold">
                          Workflow Pipeline
                        </h2>

                        <p className="mt-1 text-xs text-zinc-600">
                          Applications progress through these stages in order.
                        </p>
                      </div>

                      <div className="rounded-xl border border-white/[0.05] bg-black/20 px-3 py-2 text-xs text-zinc-600">
                        {
                          workflowStages.length
                        }{" "}
                        {workflowStages.length ===
                        1
                          ? "stage"
                          : "stages"}
                      </div>
                    </div>

                    {workflowStages.length ? (
                      <div className="mt-7">
                        <div className="space-y-3">
                          {workflowStages.map(
                            (
                              stage,
                              index
                            ) => (
                              <div
                                key={
                                  stage.id
                                }
                                className="group relative rounded-2xl border border-white/[0.06] bg-[#090a0e] p-4 transition hover:border-white/[0.1]"
                              >
                                <div className="flex items-start gap-4">
                                  <div className="relative">
                                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-violet-400/10 bg-violet-400/[0.045] text-sm font-semibold text-violet-300">
                                      {index +
                                        1}
                                    </div>

                                    {index <
                                    workflowStages.length -
                                      1 ? (
                                      <div className="absolute left-1/2 top-12 h-5 w-px -translate-x-1/2 bg-white/[0.08]" />
                                    ) : null}
                                  </div>

                                  <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <div className="font-medium text-zinc-200">
                                        {
                                          stage.name
                                        }
                                      </div>

                                      <span className="rounded-full border border-white/[0.05] bg-white/[0.03] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-600">
                                        {
                                          stage.stageType
                                        }
                                      </span>

                                      {stage.terminal ? (
                                        <span className="rounded-full border border-emerald-400/10 bg-emerald-400/[0.045] px-2 py-0.5 text-[10px] font-medium text-emerald-300/70">
                                          Terminal
                                        </span>
                                      ) : null}
                                    </div>

                                    <div className="mt-2 text-xs text-zinc-700">
                                      /{
                                        stage.slug
                                      }
                                    </div>
                                  </div>

                                  <div className="flex shrink-0 items-center gap-1 opacity-60 transition group-hover:opacity-100">
                                    <button
                                      type="button"
                                      disabled={
                                        index ===
                                        0
                                      }
                                      onClick={() =>
                                        void moveWorkflowStage(
                                          index,
                                          -1
                                        )
                                      }
                                      className="grid h-8 w-8 place-items-center rounded-lg text-zinc-700 transition hover:bg-white/[0.05] hover:text-white disabled:opacity-20"
                                      title="Move stage up"
                                    >
                                      ↑
                                    </button>

                                    <button
                                      type="button"
                                      disabled={
                                        index ===
                                        workflowStages.length -
                                          1
                                      }
                                      onClick={() =>
                                        void moveWorkflowStage(
                                          index,
                                          1
                                        )
                                      }
                                      className="grid h-8 w-8 place-items-center rounded-lg text-zinc-700 transition hover:bg-white/[0.05] hover:text-white disabled:opacity-20"
                                      title="Move stage down"
                                    >
                                      ↓
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        openWorkflowStage(
                                          stage
                                        )
                                      }
                                      className="rounded-lg px-2.5 py-2 text-xs text-zinc-500 transition hover:bg-white/[0.05] hover:text-white"
                                    >
                                      Edit
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        void deleteWorkflowStage(
                                          stage
                                        )
                                      }
                                      className="rounded-lg px-2.5 py-2 text-xs text-red-400/50 transition hover:bg-red-400/[0.06] hover:text-red-300"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-7 rounded-2xl border border-dashed border-white/[0.07] px-6 py-14 text-center">
                        <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl border border-violet-400/10 bg-violet-400/[0.04] text-lg text-violet-300">
                          ✦
                        </div>

                        <h3 className="mt-4 font-medium text-zinc-300">
                          Build your review pipeline
                        </h3>

                        <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-zinc-700">
                          Create your own stages or start with UtilityX&apos;s recommended application workflow.
                        </p>

                        <div className="mt-5 flex flex-wrap justify-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              void createRecommendedWorkflow()
                            }
                            className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black"
                          >
                            Create Recommended Workflow
                          </button>

                          <button
                            type="button"
                            onClick={
                              openNewWorkflowStage
                            }
                            className="rounded-xl border border-white/[0.07] bg-white/[0.025] px-4 py-2.5 text-sm font-medium text-zinc-500"
                          >
                            Start Manually
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-5 grid gap-4 md:grid-cols-3">
                    <div className="rounded-2xl border border-white/[0.05] bg-white/[0.015] p-5">
                      <div className="text-2xl font-semibold">
                        {
                          workflowStages.filter(
                            (stage) =>
                              !stage.terminal
                          ).length
                        }
                      </div>

                      <div className="mt-1 text-xs text-zinc-600">
                        Active review stages
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/[0.05] bg-white/[0.015] p-5">
                      <div className="text-2xl font-semibold">
                        {
                          workflowStages.filter(
                            (stage) =>
                              stage.stageType ===
                              "interview"
                          ).length
                        }
                      </div>

                      <div className="mt-1 text-xs text-zinc-600">
                        Interview stages
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/[0.05] bg-white/[0.015] p-5">
                      <div className="text-2xl font-semibold">
                        {
                          workflowStages.filter(
                            (stage) =>
                              stage.terminal
                          ).length
                        }
                      </div>

                      <div className="mt-1 text-xs text-zinc-600">
                        Terminal outcomes
                      </div>
                    </div>
                  </div>
                </>
              ) : null}

              {[
                "requirements",
                "reviewers",
                "messages",
                "branding",
                "analytics",
              ].includes(
                activeTab
              ) ? (
                <div className="grid min-h-[600px] place-items-center">
                  <div className="max-w-lg text-center">
                    <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-violet-400/10 bg-violet-400/[0.05] text-violet-300">
                      ✦
                    </div>

                    <h1 className="mt-5 text-2xl font-semibold">
                      {
                        tabs.find(
                          (
                            tab
                          ) =>
                            tab.id ===
                            activeTab
                        )?.label
                      }
                    </h1>

                    <p className="mt-3 text-sm leading-6 text-zinc-600">
                      This module is ready for its dedicated Workspace 2.0 experience.
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
          </section>
        </div>
      </div>
      {workflowEditor ? (
        <>
          <button
            type="button"
            aria-label="Close workflow editor"
            onClick={() =>
              setWorkflowEditor(
                null
              )
            }
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          />

          <aside className="fixed bottom-0 right-0 top-0 z-50 w-full max-w-[500px] overflow-y-auto border-l border-white/[0.07] bg-[#0a0b0f] shadow-2xl shadow-black/60">
            <div className="sticky top-0 border-b border-white/[0.06] bg-[#0a0b0f]/95 px-6 py-5 backdrop-blur-xl">
              <div className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-700">
                Workflow Engine
              </div>

              <h2 className="mt-1 text-lg font-semibold">
                {workflowEditor.id
                  ? "Edit Stage"
                  : "New Stage"}
              </h2>
            </div>

            <div className="space-y-5 p-6">
              <label className="block">
                <span className="text-xs font-medium text-zinc-500">
                  Stage Name
                </span>

                <input
                  autoFocus
                  value={
                    workflowEditor.name
                  }
                  onChange={(event) =>
                    setWorkflowEditor({
                      ...workflowEditor,

                      name:
                        event.target.value,
                    })
                  }
                  placeholder="Initial Review"
                  className="mt-2 w-full rounded-xl border border-white/[0.07] bg-[#07080b] px-4 py-3 text-sm outline-none focus:border-violet-400/30"
                />
              </label>

              <label className="block">
                <span className="text-xs font-medium text-zinc-500">
                  Stage Type
                </span>

                <select
                  value={
                    workflowEditor.stageType
                  }
                  onChange={(event) =>
                    setWorkflowEditor({
                      ...workflowEditor,

                      stageType:
                        event.target.value as
                          WorkflowStage["stageType"],
                    })
                  }
                  className="mt-2 w-full rounded-xl border border-white/[0.07] bg-[#07080b] px-4 py-3 text-sm"
                >
                  <option value="submitted">
                    Submitted
                  </option>

                  <option value="review">
                    Review
                  </option>

                  <option value="interview">
                    Interview
                  </option>

                  <option value="decision">
                    Decision
                  </option>

                  <option value="custom">
                    Custom
                  </option>
                </select>
              </label>

              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                <input
                  type="checkbox"
                  checked={
                    workflowEditor.terminal
                  }
                  onChange={(event) =>
                    setWorkflowEditor({
                      ...workflowEditor,

                      terminal:
                        event.target.checked,
                    })
                  }
                  className="mt-1"
                />

                <div>
                  <div className="text-sm font-medium text-zinc-300">
                    Terminal stage
                  </div>

                  <p className="mt-1 text-xs leading-5 text-zinc-600">
                    Terminal stages represent a final outcome such as Accepted or Denied.
                  </p>
                </div>
              </label>

              <div className="rounded-2xl border border-violet-400/10 bg-violet-400/[0.035] p-5">
                <div className="text-[10px] font-medium uppercase tracking-[0.15em] text-violet-300/60">
                  Preview
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl border border-violet-400/10 bg-violet-400/[0.05] text-violet-300">
                    ✦
                  </div>

                  <div>
                    <div className="font-medium text-zinc-200">
                      {workflowEditor.name ||
                        "Stage Name"}
                    </div>

                    <div className="mt-1 flex gap-2 text-[10px] text-zinc-600">
                      <span className="uppercase">
                        {
                          workflowEditor.stageType
                        }
                      </span>

                      {workflowEditor.terminal ? (
                        <span className="text-emerald-400/70">
                          Terminal
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 flex gap-3 border-t border-white/[0.06] bg-[#0a0b0f]/95 p-5 backdrop-blur-xl">
              <button
                type="button"
                onClick={() =>
                  setWorkflowEditor(
                    null
                  )
                }
                className="flex-1 rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-3 text-sm font-medium text-zinc-400"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={
                  saving
                }
                onClick={() =>
                  void saveWorkflowStage()
                }
                className="flex-1 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black disabled:opacity-50"
              >
                {saving
                  ? "Saving…"
                  : "Save Stage"}
              </button>
            </div>
          </aside>
        </>
      ) : null}

      {sectionEditor ? (
        <>
          <button
            type="button"
            aria-label="Close section editor"
            onClick={() =>
              setSectionEditor(
                null
              )
            }
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          />

          <aside className="fixed bottom-0 right-0 top-0 z-50 w-full max-w-[500px] overflow-y-auto border-l border-white/[0.07] bg-[#0a0b0f] shadow-2xl shadow-black/60">
            <div className="sticky top-0 border-b border-white/[0.06] bg-[#0a0b0f]/95 px-6 py-5 backdrop-blur-xl">
              <div className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-700">
                Form Structure
              </div>

              <h2 className="mt-1 text-lg font-semibold">
                {sectionEditor.id
                  ? "Edit Section"
                  : "New Section"}
              </h2>
            </div>

            <div className="space-y-5 p-6">
              <label className="block">
                <span className="text-xs font-medium text-zinc-500">
                  Section Title
                </span>

                <input
                  autoFocus
                  value={
                    sectionEditor.title
                  }
                  onChange={(event) =>
                    setSectionEditor({
                      ...sectionEditor,

                      title:
                        event.target.value,
                    })
                  }
                  placeholder="Experience"
                  className="mt-2 w-full rounded-xl border border-white/[0.07] bg-[#07080b] px-4 py-3 text-sm outline-none focus:border-violet-400/30"
                />
              </label>

              <label className="block">
                <span className="text-xs font-medium text-zinc-500">
                  Description
                </span>

                <textarea
                  value={
                    sectionEditor.description
                  }
                  onChange={(event) =>
                    setSectionEditor({
                      ...sectionEditor,

                      description:
                        event.target.value,
                    })
                  }
                  placeholder="Tell applicants what this section is about."
                  className="mt-2 min-h-32 w-full rounded-xl border border-white/[0.07] bg-[#07080b] px-4 py-3 text-sm outline-none focus:border-violet-400/30"
                />
              </label>

              <div className="rounded-2xl border border-white/[0.06] bg-black/20 p-5">
                <div className="text-[11px] font-medium uppercase tracking-[0.15em] text-zinc-700">
                  Preview
                </div>

                <h3 className="mt-4 text-lg font-semibold">
                  {sectionEditor.title ||
                    "Section Title"}
                </h3>

                <p className="mt-2 text-sm leading-6 text-zinc-600">
                  {sectionEditor.description ||
                    "Your section description will appear here."}
                </p>
              </div>
            </div>

            <div className="sticky bottom-0 flex gap-3 border-t border-white/[0.06] bg-[#0a0b0f]/95 p-5 backdrop-blur-xl">
              <button
                type="button"
                onClick={() =>
                  setSectionEditor(
                    null
                  )
                }
                className="flex-1 rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-3 text-sm font-medium text-zinc-400"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={
                  saving
                }
                onClick={() =>
                  void saveSection()
                }
                className="flex-1 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black disabled:opacity-50"
              >
                {saving
                  ? "Saving…"
                  : "Save Section"}
              </button>
            </div>
          </aside>
        </>
      ) : null}

      {questionDraft ? (
        <>
          <button
            type="button"
            aria-label="Close question editor"
            onClick={
              closeQuestionEditor
            }
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          />

          <aside className="fixed bottom-0 right-0 top-0 z-50 w-full max-w-[520px] overflow-y-auto border-l border-white/[0.07] bg-[#0a0b0f] shadow-2xl shadow-black/60">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/[0.06] bg-[#0a0b0f]/95 px-6 py-5 backdrop-blur-xl">
              <div>
                <div className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-700">
                  Question Editor
                </div>

                <h2 className="mt-1 text-lg font-semibold">
                  {editingQuestionIndex !== null &&
                  editingQuestionIndex <
                    questions.length
                    ? "Edit Question"
                    : "New Question"}
                </h2>
              </div>

              <button
                type="button"
                onClick={
                  closeQuestionEditor
                }
                className="grid h-9 w-9 place-items-center rounded-xl border border-white/[0.06] bg-white/[0.03] text-zinc-500 transition hover:text-white"
              >
                ×
              </button>
            </div>

            <div className="space-y-6 p-6">
              <label className="block">
                <span className="text-xs font-medium text-zinc-500">
                  Question
                </span>

                <input
                  autoFocus
                  value={
                    questionDraft.label
                  }
                  onChange={(event) =>
                    setQuestionDraft({
                      ...questionDraft,

                      label:
                        event.target.value,
                    })
                  }
                  placeholder="What would you like to ask?"
                  className="mt-2 w-full rounded-xl border border-white/[0.07] bg-[#07080b] px-4 py-3 text-sm outline-none transition focus:border-violet-400/30"
                />
              </label>

              <label className="block">
                <span className="text-xs font-medium text-zinc-500">
                  Help text
                </span>

                <textarea
                  value={
                    questionDraft.description
                  }
                  onChange={(event) =>
                    setQuestionDraft({
                      ...questionDraft,

                      description:
                        event.target.value,
                    })
                  }
                  placeholder="Optional instructions for the applicant"
                  className="mt-2 min-h-24 w-full rounded-xl border border-white/[0.07] bg-[#07080b] px-4 py-3 text-sm outline-none transition focus:border-violet-400/30"
                />
              </label>

              <label className="block">
                <span className="text-xs font-medium text-zinc-500">
                  Section
                </span>

                <select
                  value={
                    questionDraft.sectionId ??
                    ""
                  }
                  onChange={(event) =>
                    setQuestionDraft({
                      ...questionDraft,

                      sectionId:
                        event.target.value ||
                        null,
                    })
                  }
                  className="mt-2 w-full rounded-xl border border-white/[0.07] bg-[#07080b] px-4 py-3 text-sm outline-none transition focus:border-violet-400/30"
                >
                  <option value="">
                    No section
                  </option>

                  {sections.map(
                    (section) => (
                      <option
                        key={
                          section.id
                        }
                        value={
                          section.id
                        }
                      >
                        {
                          section.title
                        }
                      </option>
                    )
                  )}
                </select>

                {!sections.length ? (
                  <p className="mt-2 text-[11px] text-zinc-700">
                    Create a section first if you want to organize this question.
                  </p>
                ) : null}
              </label>

              <div>
                <div className="text-xs font-medium text-zinc-500">
                  Question Type
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  {[
                    [
                      "short",
                      "Short Answer",
                    ],
                    [
                      "long",
                      "Long Answer",
                    ],
                    [
                      "yes_no",
                      "Yes / No",
                    ],
                    [
                      "single_select",
                      "Single Select",
                    ],
                    [
                      "multi_select",
                      "Multi Select",
                    ],
                  ].map(
                    ([
                      type,
                      label,
                    ]) => (
                      <button
                        key={
                          type
                        }
                        type="button"
                        onClick={() =>
                          setQuestionDraft({
                            ...questionDraft,

                            type:
                              type as Question["type"],

                            options:
                              type ===
                                "single_select" ||
                              type ===
                                "multi_select"
                                ? questionDraft.options
                                : [],
                          })
                        }
                        className={[
                          "rounded-xl border px-3 py-3 text-left text-sm transition",
                          questionDraft.type ===
                          type
                            ? "border-violet-400/20 bg-violet-400/[0.08] text-violet-200"
                            : "border-white/[0.06] bg-white/[0.02] text-zinc-500 hover:bg-white/[0.04]",
                        ].join(
                          " "
                        )}
                      >
                        {
                          label
                        }
                      </button>
                    )
                  )}
                </div>
              </div>

              {(questionDraft.type ===
                "single_select" ||
                questionDraft.type ===
                  "multi_select") && (
                <div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-medium text-zinc-500">
                        Answer Options
                      </div>

                      <div className="mt-1 text-[11px] text-zinc-700">
                        One option per line
                      </div>
                    </div>
                  </div>

                  <textarea
                    value={
                      questionDraft.options.join(
                        "\n"
                      )
                    }
                    onChange={(event) =>
                      setQuestionDraft({
                        ...questionDraft,

                        options:
                          event.target.value.split(
                            "\n"
                          ),
                      })
                    }
                    placeholder={"Option 1\nOption 2\nOption 3"}
                    className="mt-3 min-h-36 w-full rounded-xl border border-white/[0.07] bg-[#07080b] px-4 py-3 text-sm outline-none transition focus:border-violet-400/30"
                  />
                </div>
              )}

              <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                <div>
                  <div className="text-sm font-medium">
                    Required Question
                  </div>

                  <div className="mt-1 text-xs text-zinc-600">
                    Applicant must answer before submitting.
                  </div>
                </div>

                <input
                  type="checkbox"
                  checked={
                    questionDraft.required
                  }
                  onChange={(event) =>
                    setQuestionDraft({
                      ...questionDraft,

                      required:
                        event.target.checked,
                    })
                  }
                  className="h-4 w-4"
                />
              </label>

              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.015] p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold">
                      Advanced
                    </div>

                    <p className="mt-1 text-xs leading-5 text-zinc-600">
                      Validation, scoring and conditional logic.
                    </p>
                  </div>

                  <span className="rounded-full border border-violet-400/10 bg-violet-400/[0.05] px-2 py-1 text-[10px] font-medium text-violet-300">
                    PRO
                  </span>
                </div>

                {!questionDraft.id ? (
                  <div className="mt-4 rounded-xl border border-amber-400/10 bg-amber-400/[0.04] px-4 py-3 text-xs leading-5 text-amber-200/70">
                    Save this new question once before configuring advanced settings.
                  </div>
                ) : (
                  <div className="mt-5 space-y-6">
                    {(questionDraft.type ===
                      "short" ||
                      questionDraft.type ===
                        "long") && (
                      <div>
                        <div className="text-xs font-medium text-zinc-500">
                          Response Length
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-3">
                          <label>
                            <span className="text-[11px] text-zinc-700">
                              Minimum
                            </span>

                            <input
                              type="number"
                              min="0"
                              max="4000"
                              value={
                                questionSettingsDraft.minLength ??
                                ""
                              }
                              onChange={(event) =>
                                setQuestionSettingsDraft({
                                  ...questionSettingsDraft,

                                  minLength:
                                    event.target.value ===
                                    ""
                                      ? null
                                      : Number(
                                          event.target.value
                                        ),
                                })
                              }
                              placeholder="None"
                              className="mt-2 w-full rounded-xl border border-white/[0.07] bg-[#07080b] px-3 py-2.5 text-sm"
                            />
                          </label>

                          <label>
                            <span className="text-[11px] text-zinc-700">
                              Maximum
                            </span>

                            <input
                              type="number"
                              min="1"
                              max="4000"
                              value={
                                questionSettingsDraft.maxLength ??
                                ""
                              }
                              onChange={(event) =>
                                setQuestionSettingsDraft({
                                  ...questionSettingsDraft,

                                  maxLength:
                                    event.target.value ===
                                    ""
                                      ? null
                                      : Number(
                                          event.target.value
                                        ),
                                })
                              }
                              placeholder="None"
                              className="mt-2 w-full rounded-xl border border-white/[0.07] bg-[#07080b] px-3 py-2.5 text-sm"
                            />
                          </label>
                        </div>
                      </div>
                    )}

                    <div>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs font-medium text-zinc-500">
                            Scoring Weight
                          </div>

                          <div className="mt-1 text-[11px] text-zinc-700">
                            Higher weight gives this question more influence on reviewer scoring.
                          </div>
                        </div>

                        <div className="rounded-lg bg-white/[0.04] px-3 py-1.5 text-sm font-semibold text-zinc-300">
                          {
                            questionSettingsDraft.weight
                          }×
                        </div>
                      </div>

                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={
                          questionSettingsDraft.weight
                        }
                        onChange={(event) =>
                          setQuestionSettingsDraft({
                            ...questionSettingsDraft,

                            weight:
                              Number(
                                event.target.value
                              ),
                          })
                        }
                        className="mt-4 w-full"
                      />
                    </div>

                    <div className="border-t border-white/[0.05] pt-5">
                      <div className="text-xs font-medium text-zinc-500">
                        Conditional Logic
                      </div>

                      <p className="mt-1 text-[11px] leading-5 text-zinc-700">
                        Only show this question when another answer matches a rule.
                      </p>

                      <select
                        value={
                          questionSettingsDraft.conditionalQuestionId ??
                          ""
                        }
                        onChange={(event) =>
                          setQuestionSettingsDraft({
                            ...questionSettingsDraft,

                            conditionalQuestionId:
                              event.target.value ||
                              null,

                            conditionalOperator:
                              event.target.value
                                ? questionSettingsDraft.conditionalOperator ??
                                  "equals"
                                : null,

                            conditionalValue:
                              event.target.value
                                ? questionSettingsDraft.conditionalValue
                                : null,
                          })
                        }
                        className="mt-4 w-full rounded-xl border border-white/[0.07] bg-[#07080b] px-3 py-3 text-sm"
                      >
                        <option value="">
                          Always show
                        </option>

                        {questions
                          .filter(
                            (question) =>
                              question.id &&
                              question.id !==
                                questionDraft.id
                          )
                          .map(
                            (question) => (
                              <option
                                key={
                                  question.id
                                }
                                value={
                                  question.id
                                }
                              >
                                {question.label ||
                                  "Untitled question"}
                              </option>
                            )
                          )}
                      </select>

                      {questionSettingsDraft.conditionalQuestionId ? (
                        <div className="mt-3 grid grid-cols-[150px_1fr] gap-3">
                          <select
                            value={
                              questionSettingsDraft.conditionalOperator ??
                              "equals"
                            }
                            onChange={(event) =>
                              setQuestionSettingsDraft({
                                ...questionSettingsDraft,

                                conditionalOperator:
                                  event.target.value,
                              })
                            }
                            className="rounded-xl border border-white/[0.07] bg-[#07080b] px-3 py-3 text-sm"
                          >
                            <option value="equals">
                              Equals
                            </option>

                            <option value="not_equals">
                              Does not equal
                            </option>

                            <option value="contains">
                              Contains
                            </option>
                          </select>

                          <input
                            value={
                              questionSettingsDraft.conditionalValue ??
                              ""
                            }
                            onChange={(event) =>
                              setQuestionSettingsDraft({
                                ...questionSettingsDraft,

                                conditionalValue:
                                  event.target.value ||
                                  null,
                              })
                            }
                            placeholder="Expected answer"
                            className="rounded-xl border border-white/[0.07] bg-[#07080b] px-3 py-3 text-sm"
                          />
                        </div>
                      ) : null}
                    </div>
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-white/[0.06] bg-black/20 p-5">
                <div className="text-[11px] font-medium uppercase tracking-[0.15em] text-zinc-700">
                  Preview
                </div>

                <div className="mt-4 text-sm font-medium">
                  {questionDraft.label ||
                    "Your question will appear here"}
                  {questionDraft.required ? (
                    <span className="ml-1 text-violet-300">
                      *
                    </span>
                  ) : null}
                </div>

                {questionDraft.description ? (
                  <p className="mt-2 text-xs leading-5 text-zinc-600">
                    {
                      questionDraft.description
                    }
                  </p>
                ) : null}

                <div className="mt-4 rounded-xl border border-white/[0.06] bg-[#07080b] px-4 py-3 text-sm text-zinc-700">
                  {questionTypeLabel(
                    questionDraft.type
                  )}
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 flex gap-3 border-t border-white/[0.06] bg-[#0a0b0f]/95 p-5 backdrop-blur-xl">
              <button
                type="button"
                onClick={
                  closeQuestionEditor
                }
                className="flex-1 rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-3 text-sm font-medium text-zinc-400"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={
                  applyQuestionDraft
                }
                className="flex-1 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200"
              >
                Apply Question
              </button>
            </div>
          </aside>
        </>
      ) : null}

    </main>
  );
}
