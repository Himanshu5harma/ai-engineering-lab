export interface paths {
    "/api/v1/challenges": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Challenges */
        get: operations["listChallenges"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/challenges/{slug}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Challenge */
        get: operations["getChallenge"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/challenges/{slug}/review": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Review */
        get: operations["getReview"];
        put?: never;
        /** Update Review */
        post: operations["saveReview"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/curriculum": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Curriculum Plan */
        get: operations["getCurriculum"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/dashboard": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Dashboard */
        get: operations["getDashboard"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/designs": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Design Catalog */
        get: operations["listDesigns"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/designs/{slug}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Design Detail */
        get: operations["getDesign"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/designs/{slug}/previous-drafts": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Previous Drafts */
        get: operations["listPreviousDrafts"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/designs/{slug}/workspace": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Design Save */
        post: operations["saveDesign"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/execution": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Execution */
        get: operations["getExecution"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/health": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Health */
        get: operations["getHealth"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/progress": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Dashboard */
        get: operations["getProgress"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/submissions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** History */
        get: operations["listSubmissions"];
        put?: never;
        /** Submit */
        post: operations["createSubmission"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/submissions/{submission_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Submission */
        get: operations["getSubmission"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/submissions/{submission_id}/results": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Results */
        get: operations["getResults"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/tracks": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Tracks */
        get: operations["listTracks"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        /** ActivityDay */
        ActivityDay: {
            /** Date */
            date: string;
            /** Executions */
            executions: number;
        };
        /** ChallengeCatalog */
        ChallengeCatalog: {
            /** Items */
            items: components["schemas"]["ChallengeSummary"][];
            /** Total */
            total: number;
        };
        /** ChallengeDetail */
        ChallengeDetail: {
            /** Constraints */
            constraints: string[];
            /** Curriculum Id */
            curriculum_id: string | null;
            /**
             * Difficulty
             * @enum {string}
             */
            difficulty: "Foundation" | "Intermediate" | "Advanced" | "Senior / Production";
            /** Function Name */
            function_name: string;
            /** Hints */
            hints: string[];
            /** Learning Objectives */
            learning_objectives: string[];
            /** Learning Order */
            learning_order: number | null;
            /** Problem */
            problem: string;
            /** Production Relevance */
            production_relevance: string;
            /** Production Review */
            production_review: string;
            /** Public Cases */
            public_cases: components["schemas"]["PublicCase"][];
            /** Public Count */
            public_count: number;
            /**
             * Schema Version
             * @constant
             */
            schema_version: 1;
            /** Slug */
            slug: string;
            /** Starter Code */
            starter_code: string;
            /** Summary */
            summary: string;
            /** Tags */
            tags: string[];
            /** Title */
            title: string;
            /** Track */
            track: string;
            /** Verification Count */
            verification_count: number;
            /** Version */
            version: number;
            /** Version Id */
            version_id: string;
        };
        /** ChallengeSummary */
        ChallengeSummary: {
            /** Constraints */
            constraints: string[];
            /** Curriculum Id */
            curriculum_id: string | null;
            /**
             * Difficulty
             * @enum {string}
             */
            difficulty: "Foundation" | "Intermediate" | "Advanced" | "Senior / Production";
            /** Function Name */
            function_name: string;
            /** Learning Objectives */
            learning_objectives: string[];
            /** Learning Order */
            learning_order: number | null;
            /** Production Relevance */
            production_relevance: string;
            /** Public Count */
            public_count: number;
            /**
             * Schema Version
             * @constant
             */
            schema_version: 1;
            /** Slug */
            slug: string;
            /** Summary */
            summary: string;
            /** Tags */
            tags: string[];
            /** Title */
            title: string;
            /** Track */
            track: string;
            /** Version */
            version: number;
            /** Version Id */
            version_id: string;
        };
        /** ComponentData */
        "ComponentData-Input": {
            /**
             * Kind
             * @enum {string}
             */
            kind: "client" | "service" | "model" | "database" | "queue" | "cache" | "external";
            /** Label */
            label: string;
            /**
             * Notes
             * @default
             */
            notes: string;
        };
        /** ComponentData */
        "ComponentData-Output": {
            /**
             * Kind
             * @enum {string}
             */
            kind: "client" | "service" | "model" | "database" | "queue" | "cache" | "external";
            /** Label */
            label: string;
            /**
             * Notes
             * @default
             */
            notes: string;
        };
        /** CreateSubmission */
        CreateSubmission: {
            /**
             * Action
             * @enum {string}
             */
            action: "run" | "submit";
            /** Challenge Slug */
            challenge_slug: string;
            /** Code */
            code: string;
            /** Version Id */
            version_id: string;
        };
        /** CurriculumEntry */
        CurriculumEntry: {
            /** Available */
            available: boolean;
            /** Difficulty */
            difficulty?: ("E" | "M" | "H" | "S") | null;
            /** Focus */
            focus?: string | null;
            /** Id */
            id: string;
            /** Learning Order */
            learning_order: number | null;
            /** Slug */
            slug?: string | null;
            /** Title */
            title: string;
            /** Track */
            track?: string | null;
            /** Track Title */
            track_title?: string | null;
        };
        /** CurriculumModuleView */
        CurriculumModuleView: {
            /** Available Count */
            available_count: number;
            /** Entries */
            entries: components["schemas"]["CurriculumEntry"][];
            /** Id */
            id: string;
            /** Target Count */
            target_count: number;
            /** Title */
            title: string;
        };
        /** CurriculumView */
        CurriculumView: {
            /** Design Deliverables */
            design_deliverables: string[];
            /** First Release */
            first_release: string[];
            /** Modules */
            modules: components["schemas"]["CurriculumModuleView"][];
            /** Title */
            title: string;
            /** Total Planned */
            total_planned: number;
            /** Weekly Hours */
            weekly_hours: {
                [key: string]: number;
            };
        };
        /** DesignCatalog */
        DesignCatalog: {
            /** Items */
            items: components["schemas"]["DesignSummary"][];
        };
        /** DesignChallenge */
        DesignChallenge: {
            /** Constraints */
            constraints: string[];
            /** Difficulty */
            difficulty: string;
            /** Follow Ups */
            follow_ups: string[];
            /** Id */
            id: string;
            /** Prompts */
            prompts: {
                [key: string]: string;
            };
            /** Requirements */
            requirements: string[];
            /** Rubric */
            rubric: components["schemas"]["RubricCriterion"][];
            /** Scale */
            scale: string[];
            /** Scenario */
            scenario: string;
            /** Slug */
            slug: string;
            /** Summary */
            summary: string;
            /** Tags */
            tags: string[];
            /** Timebox Minutes */
            timebox_minutes: number;
            /** Title */
            title: string;
            /** Version */
            version: number;
        };
        /** DesignDetail */
        DesignDetail: {
            /** Constraints */
            constraints: string[];
            /** Difficulty */
            difficulty: string;
            /** Follow Ups */
            follow_ups: string[];
            /** Id */
            id: string;
            /** Previous Draft Count */
            previous_draft_count: number;
            /** Prompts */
            prompts: {
                [key: string]: string;
            };
            /** Requirements */
            requirements: string[];
            /** Rubric */
            rubric: components["schemas"]["RubricCriterion"][];
            /** Scale */
            scale: string[];
            /** Scenario */
            scenario: string;
            /** Slug */
            slug: string;
            /** Summary */
            summary: string;
            /** Tags */
            tags: string[];
            /** Timebox Minutes */
            timebox_minutes: number;
            /** Title */
            title: string;
            /** Version */
            version: number;
            /** Version Id */
            version_id: string;
            workspace: components["schemas"]["WorkspaceView"];
        };
        /** DesignDocument */
        "DesignDocument-Input": {
            /**
             * Adr
             * @default
             */
            adr: string;
            /**
             * Capacity
             * @default
             */
            capacity: string;
            diagram?: components["schemas"]["Diagram-Input"];
            /**
             * Failures
             * @default
             */
            failures: string;
            /**
             * Flow
             * @default
             */
            flow: string;
            /** Ratings */
            ratings?: {
                [key: string]: "unreviewed" | "needs_work" | "defensible";
            };
        };
        /** DesignDocument */
        "DesignDocument-Output": {
            /**
             * Adr
             * @default
             */
            adr: string;
            /**
             * Capacity
             * @default
             */
            capacity: string;
            diagram: components["schemas"]["Diagram-Output"];
            /**
             * Failures
             * @default
             */
            failures: string;
            /**
             * Flow
             * @default
             */
            flow: string;
            /** Ratings */
            ratings: {
                [key: string]: "unreviewed" | "needs_work" | "defensible";
            };
        };
        /** DesignSummary */
        DesignSummary: {
            /** Difficulty */
            difficulty: string;
            /** Id */
            id: string;
            /** Previous Draft Count */
            previous_draft_count: number;
            /** Slug */
            slug: string;
            /** Summary */
            summary: string;
            /** Tags */
            tags: string[];
            /** Timebox Minutes */
            timebox_minutes: number;
            /** Title */
            title: string;
            /** Version Id */
            version_id: string;
            workspace: components["schemas"]["WorkspaceView"];
        };
        /** DesignUpdate */
        DesignUpdate: {
            /**
             * Action
             * @default save
             * @enum {string}
             */
            action: "save" | "submit_for_review";
            document: components["schemas"]["DesignDocument-Input"];
            /** Revision */
            revision: number;
            /** Source Revision */
            source_revision?: number | null;
            /** Source Version Id */
            source_version_id?: string | null;
            /** Version Id */
            version_id: string;
        };
        /** Diagram */
        "Diagram-Input": {
            /** Edges */
            edges?: components["schemas"]["DiagramEdge-Input"][];
            /** Nodes */
            nodes?: components["schemas"]["DiagramNode-Input"][];
            viewport?: components["schemas"]["Viewport-Input"];
        };
        /** Diagram */
        "Diagram-Output": {
            /** Edges */
            edges: components["schemas"]["DiagramEdge-Output"][];
            /** Nodes */
            nodes: components["schemas"]["DiagramNode-Output"][];
            viewport: components["schemas"]["Viewport-Output"];
        };
        /** DiagramEdge */
        "DiagramEdge-Input": {
            /** Id */
            id: string;
            /**
             * Label
             * @default
             */
            label: string;
            /** Source */
            source: string;
            /** Target */
            target: string;
        };
        /** DiagramEdge */
        "DiagramEdge-Output": {
            /** Id */
            id: string;
            /**
             * Label
             * @default
             */
            label: string;
            /** Source */
            source: string;
            /** Target */
            target: string;
        };
        /** DiagramNode */
        "DiagramNode-Input": {
            data: components["schemas"]["ComponentData-Input"];
            /** Id */
            id: string;
            position: components["schemas"]["Position"];
        };
        /** DiagramNode */
        "DiagramNode-Output": {
            data: components["schemas"]["ComponentData-Output"];
            /** Id */
            id: string;
            position: components["schemas"]["Position"];
        };
        /** ErrorDetail */
        ErrorDetail: {
            /** Code */
            code: string;
            /** Details */
            details?: unknown;
            /** Message */
            message: string;
        };
        /** ErrorResponse */
        ErrorResponse: {
            error: components["schemas"]["ErrorDetail"];
        };
        /** ExecutionAvailability */
        ExecutionAvailability: {
            /** Available */
            available: boolean;
            /** Message */
            message: string;
        };
        /** HealthView */
        HealthView: {
            execution: components["schemas"]["ExecutionAvailability"];
            /**
             * Status
             * @constant
             */
            status: "ok";
        };
        /** Position */
        Position: {
            /** X */
            x: number;
            /** Y */
            y: number;
        };
        /** PreviousDrafts */
        PreviousDrafts: {
            /** Items */
            items: components["schemas"]["WorkspaceView"][];
        };
        /** ProgressView */
        ProgressView: {
            /** Attempted */
            attempted: number;
            /** Evidence Note */
            evidence_note: string;
            /** Recent Submissions */
            recent_submissions: components["schemas"]["SubmissionView"][];
            /** Review Completed Slugs */
            review_completed_slugs: string[];
            /** Runs */
            runs: number;
            /** Solved Slugs */
            solved_slugs: string[];
            /** Submissions */
            submissions: number;
            /** Total Challenges */
            total_challenges: number;
            /** Weekly Activity */
            weekly_activity: components["schemas"]["ActivityDay"][];
        };
        /** PublicCase */
        PublicCase: {
            /** Expected */
            expected?: unknown;
            /** Kwargs */
            kwargs: {
                [key: string]: unknown;
            };
            /** Name */
            name: string;
            /** Raises */
            raises?: ("ValueError" | "TypeError") | null;
        };
        /** ResultView */
        ResultView: {
            /** Actual */
            actual?: unknown;
            /** Error */
            error: string;
            /** Expected */
            expected?: unknown;
            /** Hidden */
            hidden: boolean;
            /** Name */
            name: string;
            /** Passed */
            passed: boolean;
            /** Stdout */
            stdout: string;
        };
        /** ResultsView */
        ResultsView: {
            /** Results */
            results: components["schemas"]["ResultView"][];
            /**
             * Status
             * @enum {string}
             */
            status: "queued" | "running" | "passed" | "failed" | "timed_out" | "execution_error" | "infrastructure_error";
        };
        /** ReviewTask */
        ReviewTask: {
            /** Description */
            description: string;
            /**
             * Id
             * @enum {string}
             */
            id: "performance" | "security" | "failure_analysis" | "tradeoffs" | "code_quality" | "interview";
            /** Title */
            title: string;
        };
        /** ReviewUpdate */
        ReviewUpdate: {
            /** Completed Tasks */
            completed_tasks: ("performance" | "security" | "failure_analysis" | "tradeoffs" | "code_quality" | "interview")[];
            /**
             * Notes
             * @default
             */
            notes: string;
            /**
             * Revision
             * @default 0
             */
            revision: number;
            /** Version Id */
            version_id: string;
        };
        /** ReviewView */
        ReviewView: {
            /** Code Verified */
            code_verified: boolean;
            /** Completed Tasks */
            completed_tasks: ("performance" | "security" | "failure_analysis" | "tradeoffs" | "code_quality" | "interview")[];
            /**
             * Evidence Type
             * @constant
             */
            evidence_type: "learner_self_review";
            /** Notes */
            notes: string;
            /** Notice */
            notice: string;
            /** Revision */
            revision: number;
            /** Tasks */
            tasks: components["schemas"]["ReviewTask"][];
            /** Updated At */
            updated_at: string | null;
            /** Version Id */
            version_id: string;
        };
        /** RubricCriterion */
        RubricCriterion: {
            /** Evidence */
            evidence: string;
            /** Id */
            id: string;
            /** Question */
            question: string;
            /** Title */
            title: string;
        };
        /** SubmissionHistory */
        SubmissionHistory: {
            /** Has More */
            has_more: boolean;
            /** Items */
            items: components["schemas"]["SubmissionView"][];
            /** Limit */
            limit: number;
            /** Offset */
            offset: number;
        };
        /** SubmissionView */
        SubmissionView: {
            /**
             * Action
             * @enum {string}
             */
            action: "run" | "submit";
            /** Challenge Slug */
            challenge_slug: string;
            /** Code */
            code?: string | null;
            /** Completed At */
            completed_at: string | null;
            /**
             * Created At
             * Format: date-time
             */
            created_at: string;
            /** Duration Ms */
            duration_ms: number | null;
            /** Id */
            id: string;
            /** Message */
            message: string;
            /** Results */
            results: components["schemas"]["ResultView"][];
            /**
             * Status
             * @enum {string}
             */
            status: "queued" | "running" | "passed" | "failed" | "timed_out" | "execution_error" | "infrastructure_error";
            /** Version Id */
            version_id: string;
        };
        /** TrackView */
        TrackView: {
            /** Id */
            id: string;
            /** Title */
            title: string;
        };
        /** Viewport */
        "Viewport-Input": {
            /**
             * X
             * @default 0
             */
            x: number;
            /**
             * Y
             * @default 0
             */
            y: number;
            /**
             * Zoom
             * @default 1
             */
            zoom: number;
        };
        /** Viewport */
        "Viewport-Output": {
            /**
             * X
             * @default 0
             */
            x: number;
            /**
             * Y
             * @default 0
             */
            y: number;
            /**
             * Zoom
             * @default 1
             */
            zoom: number;
        };
        /** WorkspaceView */
        WorkspaceView: {
            /** Completeness */
            completeness: {
                [key: string]: boolean;
            };
            document: components["schemas"]["DesignDocument-Output"];
            /**
             * Evidence Type
             * @constant
             */
            evidence_type: "learner_design_and_self_review";
            exercise_snapshot: components["schemas"]["DesignChallenge"] | null;
            /** Notice */
            notice: string;
            /** Revision */
            revision: number;
            /** Source Revision */
            source_revision: number | null;
            /** Source Version Id */
            source_version_id: string | null;
            /**
             * Status
             * @enum {string}
             */
            status: "draft" | "ready_for_review";
            /** Updated At */
            updated_at: string | null;
            /** Version Id */
            version_id: string;
        };
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
    listChallenges: {
        parameters: {
            query?: {
                track?: string | null;
                difficulty?: string | null;
                offset?: number;
                limit?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ChallengeCatalog"];
                };
            };
            /** @description Bad Request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Conflict */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Request Entity Too Large */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unprocessable Entity */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Too Many Requests */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Service Unavailable */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    getChallenge: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                slug: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ChallengeDetail"];
                };
            };
            /** @description Bad Request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Conflict */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Request Entity Too Large */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unprocessable Entity */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Too Many Requests */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Service Unavailable */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    getReview: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                slug: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ReviewView"];
                };
            };
            /** @description Bad Request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Conflict */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Request Entity Too Large */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unprocessable Entity */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Too Many Requests */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Service Unavailable */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    saveReview: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                slug: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ReviewUpdate"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ReviewView"];
                };
            };
            /** @description Bad Request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Conflict */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Request Entity Too Large */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unprocessable Entity */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Too Many Requests */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Service Unavailable */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    getCurriculum: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CurriculumView"];
                };
            };
            /** @description Bad Request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Conflict */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Request Entity Too Large */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unprocessable Entity */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Too Many Requests */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Service Unavailable */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    getDashboard: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ProgressView"];
                };
            };
            /** @description Bad Request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Conflict */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Request Entity Too Large */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unprocessable Entity */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Too Many Requests */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Service Unavailable */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    listDesigns: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["DesignCatalog"];
                };
            };
            /** @description Bad Request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Conflict */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Request Entity Too Large */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unprocessable Entity */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Too Many Requests */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Service Unavailable */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    getDesign: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                slug: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["DesignDetail"];
                };
            };
            /** @description Bad Request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Conflict */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Request Entity Too Large */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unprocessable Entity */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Too Many Requests */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Service Unavailable */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    listPreviousDrafts: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                slug: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PreviousDrafts"];
                };
            };
            /** @description Bad Request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Conflict */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Request Entity Too Large */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unprocessable Entity */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Too Many Requests */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Service Unavailable */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    saveDesign: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                slug: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["DesignUpdate"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["WorkspaceView"];
                };
            };
            /** @description Bad Request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Conflict */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Request Entity Too Large */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unprocessable Entity */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Too Many Requests */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Service Unavailable */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    getExecution: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ExecutionAvailability"];
                };
            };
            /** @description Bad Request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Conflict */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Request Entity Too Large */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unprocessable Entity */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Too Many Requests */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Service Unavailable */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    getHealth: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HealthView"];
                };
            };
            /** @description Bad Request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Conflict */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Request Entity Too Large */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unprocessable Entity */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Too Many Requests */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Service Unavailable */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    getProgress: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ProgressView"];
                };
            };
            /** @description Bad Request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Conflict */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Request Entity Too Large */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unprocessable Entity */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Too Many Requests */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Service Unavailable */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    listSubmissions: {
        parameters: {
            query?: {
                challenge_slug?: string | null;
                offset?: number;
                limit?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SubmissionHistory"];
                };
            };
            /** @description Bad Request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Conflict */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Request Entity Too Large */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unprocessable Entity */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Too Many Requests */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Service Unavailable */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    createSubmission: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateSubmission"];
            };
        };
        responses: {
            /** @description Successful Response */
            202: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SubmissionView"];
                };
            };
            /** @description Bad Request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Conflict */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Request Entity Too Large */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unprocessable Entity */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Too Many Requests */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Service Unavailable */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    getSubmission: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                submission_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SubmissionView"];
                };
            };
            /** @description Bad Request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Conflict */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Request Entity Too Large */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unprocessable Entity */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Too Many Requests */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Service Unavailable */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    getResults: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                submission_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ResultsView"];
                };
            };
            /** @description Bad Request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Conflict */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Request Entity Too Large */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unprocessable Entity */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Too Many Requests */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Service Unavailable */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    listTracks: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TrackView"][];
                };
            };
            /** @description Bad Request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Conflict */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Request Entity Too Large */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unprocessable Entity */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Too Many Requests */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Service Unavailable */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
}
