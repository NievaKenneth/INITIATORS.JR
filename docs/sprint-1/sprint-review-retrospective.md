# Sprint 1 Review and Retrospective Report

## 1. Sprint Information

- **Project:** INITIATORS HOPE INC. ERP
- **Sprint:** Sprint 1
- **Duration:** Weeks 1–2
- **Review Date:** To be completed during the team Sprint Review
- **Prepared by:** Scrum Master

## 2. Sprint Goals

This section reviews the main goals established for Sprint 1 and records the progress supported by the available project evidence.

| Sprint Goal | Expected Result | Actual Result | Status |
|---|---|---|---|
| Establish project foundation | Repository and development workflow prepared | Project development and collaboration continued through the repository and pull request workflow. | Evidence available; final verification pending |
| Prepare database foundation | Initial database structure established | Database structures and migrations were prepared. Database audit testing was also completed and documented. | Partially complete |
| Set up authentication and access control | Authentication and user roles prepared | Login, logout, session handling, blocked-user handling, password reset, and email confirmation work were merged. | Implementation merged; final acceptance review pending |
| Prepare User Management groundwork | Initial user management structure established | User Management functionality covering user listing, adding, editing, and blocking/unblocking was merged. | Implementation merged; remaining requirements need review |

## 3. Completed Tasks

The following work has verified merged pull requests available as evidence.

| Task / Work | Assigned Role | Evidence | Completion Status | Notes |
|---|---|---|---|---|
| Login, logout, sessions, and blocked-user handling | Developer | PR #49 | Merged | Authentication-related functionality was merged into the main branch. |
| Password reset and email confirmation | Developer | PR #50 | Merged | Password reset and email confirmation functionality was merged. |
| User Management | Developer | PR #51 | Merged | User listing, adding, editing, and block/unblock functionality was merged. |
| Audit user database testing documentation | DB Admin | PR #56 | Merged | Documented successful database-side audit testing. Application identity integration remains pending verification. |

**Note:** This list records verified merged work and is not necessarily a complete list of every Sprint 1 task. Other task statuses should be confirmed using the project task tracker.

## 4. Sprint Goal and Acceptance Criteria Review

The following table records implementation evidence and the current verification status. A merged pull request does not automatically mean that every acceptance criterion has passed testing.

| Task / Feature | Acceptance Criteria Met? | Evidence / Notes |
|---|---|---|
| Login and logout | Pending final acceptance review | PR #49 merged. Login, logout, session handling, and blocked-user handling were included. |
| Password reset and email confirmation | Pending final acceptance review | PR #50 merged. Password reset and email confirmation functionality was included. |
| User Management | Pending final acceptance review | PR #51 merged. User listing, adding, editing, and block/unblock functionality was included. |
| Database audit user testing | Database-side tests passed | PR #56 merged. The `audit_user()` function, session-user fallback, audit log entry, and transaction rollback were tested successfully. |
| Application identity integration | Not yet verified | The database-side audit tests passed, but the actual logged-in application identity flow still needs Developer verification. |

Final acceptance should be confirmed with the Tester and the relevant team members.

## 5. Sprint Achievements

The following achievements are supported by the available project records:

1. Authentication-related development work was merged into the main branch.
2. Password reset and email confirmation functionality was merged.
3. User Management functionality was merged.
4. Database-side audit testing was successfully performed and documented.
5. Pull requests were used to record and integrate completed development work.
6. Remaining verification items were identified for follow-up rather than being marked complete without evidence.

## 6. Challenges Encountered

The following items should be discussed and confirmed during the Sprint Review:

- Verification of application identity integration with database audit logging remains pending.
- Some acceptance criteria still require confirmation through testing.
- The team needs to confirm whether all planned Sprint 1 tasks have been completed and properly documented.
- Any delays, technical difficulties, coordination issues, or unresolved blockers should be recorded based on actual team feedback.

## 7. Sprint Retrospective

**Retrospective Basis:** This retrospective was prepared by the Scrum Master based on observed Sprint 1 progress, completed tasks, merged pull requests, and identified pending work. Team members were unavailable to provide individual feedback, so the observations below represent the Scrum Master's assessment.

### 7.1 What Went Well?

- The team used GitHub branches and pull requests to organize development work and integrate changes into the main branch.
- Authentication-related functionality, including login, logout, session handling, and blocked-user handling, was merged.
- Password reset and email confirmation functionality was merged.
- User Management functionality covering user listing, adding, editing, and blocking or unblocking users was merged.
- Database audit testing was performed successfully, and the results were documented.
- Assigned team roles helped organize development, database administration, testing, UI/UX, and project coordination responsibilities.

### 7.2 What Could Be Improved?

- Acceptance criteria and testing evidence should be reviewed more consistently before tasks are marked complete.
- Application and database integration should be verified earlier during development.
- Task progress and completion statuses should be updated regularly in the sprint task plan.
- Technical issues, dependencies, and blockers should be communicated as early as possible.
- Pull requests should include clear descriptions and sufficient evidence of completed work.

### 7.3 What Should We Try Next Sprint?

- Conduct regular sprint progress checks and update task statuses.
- Review acceptance criteria before considering a task complete.
- Coordinate application development and database changes earlier.
- Record blockers and assign follow-up actions with clear responsibilities.
- Maintain organized documentation for implementation and testing results.

## 8. Lessons Learned

Sprint 1 demonstrated the importance of clear task ownership, organized development workflows, and proper documentation. Using GitHub branches and pull requests helped track changes and integrate development work.

The sprint also highlighted that merging a feature does not automatically confirm that all its acceptance criteria have been satisfied. Testing and verification must be performed separately, especially when application functionality depends on database behavior.

The Scrum Master should continue monitoring task progress, coordinating dependencies, maintaining accurate sprint records, and ensuring that unfinished work is carried into the next sprint.

## 9. Improvement Actions for Sprint 2

The following improvement actions are established by the Scrum Master based on the Sprint 1 review.

| Improvement Action | Responsible Person | Target Date | Status |
|---|---|---|---|
| Monitor and update the sprint task plan regularly | Scrum Master | Throughout Sprint 2 | Planned |
| Verify acceptance criteria and document test results | Tester and Developer | Before task completion | Planned |
| Verify application identity integration with database audit logging | Developer and DB Admin | Sprint 2 | Pending coordination |
| Communicate blockers and delays as early as possible | All Team Members | Throughout Sprint 2 | Planned |
| Ensure pull requests have clear descriptions and supporting evidence | All Contributors | For every pull request | Planned |
| Review unfinished Sprint 1 tasks and carry them into the appropriate sprint backlog | Scrum Master and Team Members | Sprint 2 planning | Planned |

## 10. Conclusion

Sprint 1 achieved measurable progress in authentication, password reset, email confirmation, User Management, and database audit testing. Several development pull requests were successfully merged into the main branch, and database-side audit testing was completed and documented.

The review also identified areas requiring continued attention, particularly acceptance criteria verification, application and database integration, task tracking, and communication of technical blockers.

The Scrum Master prepared this retrospective and its improvement actions based on the available project evidence and observed sprint progress. These actions will guide the team's planning and coordination during Sprint 2.

**Report Prepared by:** Scrum Master

**Review Status:** Scrum Master assessment completed. Final implementation and acceptance verification remain subject to the relevant task owners and Tester.
