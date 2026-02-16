# RBAC & LBAC System Specification

## 1. Overview
The RBAC (Role-Based Access Control) system is enhanced with LBAC (Lattice-Based Access Control) concepts to provide a robust, hierarchical, and security-principled authorization framework. It integrates the Biba Integrity Model and Data Visibility levels to ensure data integrity and confidentiality.

## 2. Core Security Principles
- **Least Privilege:** Users are granted the minimum level of access required to perform their functions.
- **Need to Know:** Access is restricted to data necessary for a specific task, even if a user has a high clearance level.
- **Biba Integrity Model:**
  - **No Read Down:** A user can only read data at or above their clearance level. *In this implementation: User Clearance ≥ Resource Sensitivity.*
  - **No Write Up:** A user can only write data at their own clearance level to prevent integrity pollution. *In this implementation: User Clearance == Resource Sensitivity.*

## 3. Permission Model
### Standard Permissions
- `create` (Synonyms: `add`, `post`)
- `read` (Synonyms: `view`, `get`, `print`, `share`, `export`)
- `update` (Synonyms: `edit`, `put`, `patch`)
- `delete` (Synonyms: `remove`, `destroy`)

### Special Permissions
- `all`: Grants all standard permissions (`create`, `read`, `update`, `delete`).
- `none`: Explicitly denies all permissions. Takes precedence in scopes.

## 4. Sensitivity & Clearance
### 4.1 Sensitivity Levels (Resources)
Resources are assigned a sensitivity level (defaulting to `Protected`):
1. `Public`: Accessible to everyone.
2. `Protected`: Internal data, requires standard authentication.
3. `Restricted`: Sensitive data, requires specific authorization.
4. `Confidential`: Highly sensitive data, restricted to specific roles.
5. `Secret`: Critical data, maximum restriction.

### 4.2 Clearance Levels (Users)
A user's clearance level determines their ability to interact with resources:

- **Read Operations:** (`read`, `view`, `get`, `print`, `share`, `export`)
  - **Rule:** User Clearance ≥ Resource Sensitivity.
- **Write Operations:** (`create`, `add`, `update`, `edit`, `delete`, `remove`)
  - **Rule:** User Clearance == Resource Sensitivity.
  - **Note:** Strict equality prevents users from "polluting" higher integrity levels or accidentally modifying lower levels.

#### Clearance Assignment Rules
1. **Self-Assignment:** A user cannot assign a clearance/sensitivity level higher than their own.
2. **Approval Process:** Assigning a level higher than one's own requires multi-party approval (Section 9).
3. **Lower-Level Assignment:** A user can assign levels lower than their own (integrity downgrade).
4. **Audit Logging:** All level changes must be logged with justification.

## 5. Level of Data Visibility (LoDV)
When a user has `read` access, the following visibility states apply:
1. `Clear Text`: Full data visibility.
2. `Partial Masking`: Some attributes are hidden (e.g., `****-****-1234`).
3. `Obfuscation`: Data is transformed to be unreadable but preserves format.
4. `Anonymization`: Data is scrubbed/aggregated. Mandatory for non-owners on highly sensitive resources (e.g., passwords).
5. `Redaction`: Total removal of the attribute (NULL or `[REDACTED]`).

## 6. Resource Hierarchy
- **Separator:** `/` (e.g., `org/dept/resource`).
- **Naming:** Alphanumeric, underscores, hyphens.
- **Grouping:** `{}` with commas (e.g., `finance/{records,invoices}`).
- **Wildcards:** `*` (single level), `**` (all nested levels).
- **Placeholders:** `:owner` (represents the unique ID of the resource owner).

## 7. System Components
### 7.1 Actions
Reusable-named entities that map one or multiple resources to permission-sensitivity pairs.
- Support defining multiple resources per action.
- Support multiple sensitivity levels per resource.
- Define visibility levels (LoDV) for each sensitivity.
- Support optional approval processes per permission.
- **Action-Level Nesting:** `access` and `approvals` can be applied to each resource individually or stacked together for a group of resources.
- **YAML Structure:**
  ```yaml
  actions:
    - id: ActionName
      resources:
        - id: path/to/res1
          access: # Resource-specific access
            - sensitivity: SensitivityLevel
              permissions: [perm1]
          approvals: # Resource-specific approvals
            - permissions: [perm1]
              required_approvers: 1
        - id: path/to/res2
      access: # Shared access for all resources in this action
        - sensitivity: SensitivityLevel
          permissions: [perm1, perm2]
          visibility: VisibilityState
      approvals: # Shared approvals for all resources in this action
        - permissions: [delete]
          required_approvers: 2
          valid_duration: 4h
          max_operations: 1
  ```

### 7.2 Roles
Aggregations of Actions.
- **Single Inheritance:** A role can have one parent.
- **Enhancement Rule:** Child roles add to or refine parent permissions; they cannot reduce them.
- **Separation of Duties:** Roles can define which actions they are authorized to approve.
- **YAML Structure:**
  ```yaml
  roles:
    - id: RoleName
      parent: ParentRoleName # Optional
      actions:
        - ActionName
      approvable_actions: # Optional: Actions this role can approve
        - action: ActionName
          permissions: [delete] # Optional: Specific permissions
  ```

### 7.3 Scopes
Temporary intersection masks applied to a user (e.g., `GuestScope`).
- **Intersection Logic:** Effective Permissions = (Aggregated Roles Permissions) ∩ (Scope Permissions).
- **Limit:** Only one scope can be active at a time.
- **YAML Structure:**
  ```yaml
  scopes:
    - id: ScopeName
      permissions: [read] # Global mask
      resources:
        - id: path/to/resource
          permissions: [read, update] # Specific mask
  ```

### 7.4 Users
Assignments of users to roles, clearance levels, and optional scopes. User configuration defines how individuals are mapped to the authorization model.
- **Clearance level:** Determines the user's ability to read and write data based on resource severity (Biba Integrity Model).
- **Roles:** A list of roles assigned to the user. Permissions from all assigned roles are aggregated. If multiple roles define different clearance requirements for the same resource, the user effectively operates with the highest clearance granted by their roles for that specific context, while still being bound by their global user-level clearance.
- **Scope:** An optional temporary intersection mask. Only one scope can be active at a time to limit effective permissions.
- **Approvals:** Roles can be configured to require an approval process for high-sensitivity actions (e.g., `Secret` level modifications).
- **YAML Structure:**
  ```yaml
  users:
    - id: UserID
      name: UserName
      clearance: ClearanceLevel # Global maximum clearance
      roles:
        - id: Role1
          clearance: RoleSpecificClearance # Optional: context-specific clearance
        - id: Role2
      scope: ScopeName # Optional
  ```

## 8. Resource Path Evaluation Logic
To ensure consistent authorization, resource paths are evaluated following these rules:

### 8.1 Path Normalization
Before evaluation, all paths (from Actions, Scopes, and incoming requests) are normalized:
- Trailing slashes are removed.
- Redundant separators (e.g., `//`) are collapsed.

### 8.2 Evaluation Order (Precedence)
When multiple Actions or Scope entries match a requested resource path, the following precedence rules apply:

1. **Exact Match:** The most specific path without wildcards takes the highest priority.
2. **Wildcard Specificity:**
   - Single-level wildcards (`*`) are evaluated before multi-level wildcards (`**`).
   - Longer paths (more segments) are evaluated before shorter paths.
3. **Placeholder Resolution:** Paths containing `:owner` are treated as exact matches if the owner ID matches the current user.

### 8.3 Matching Algorithm
1. **Direct Match:** `path/to/res` matches `path/to/res`.
2. **Implicit Recursive Wildcard:** Any resource path implicitly includes all its nested children. For example, `organization/engineering` implicitly matches `organization/engineering/projects`.
3. **Explicit Depth Control:** To prevent revealing deeper resources when using implicit matching, an explicit `none` permission can be defined for the sub-path in a subsequent or more specific action/scope entry. Evaluation precedence (Section 8.2) ensures the more specific restriction takes priority.
4. **Brace Expansion:** `path/{a,b}` is expanded to `path/a` and `path/b` before matching.
5. **Single Wildcard (`*`):** `org/*/repo` matches `org/project-a/repo` but NOT `org/project-a/sub/repo`.
6. **Recursive Wildcard (`**`):**
   - **Evaluation Order:** Recursive wildcards are evaluated **after** exact matches and single-level wildcards.
   - `org/**` matches `org/any/depth/resource`.
   - `/**/resource` matches any path that ends with `/resource` (e.g., `org/project/resource` and `org/dept/project/resource`).
   - `**/resource` at the beginning of a path is treated as `/**/resource` (anchored to any depth from root).
   - Using `/**` at the end of a path is redundant due to implicit recursion (Section 8.3.2) but supported for clarity.

### 8.4 Conflicts
If multiple actions of the same precedence match (e.g., two different actions both defining `org/**`), their permissions and visibility levels are **aggregated** for roles (Enhancement Rule) and **intersected** for scopes.

## 9. Separation of Duties & Approvals
To maintain high integrity and prevent unauthorized high-sensitivity modifications, the system implements a Separation of Duties (SoD) through an approval workflow.

### 9.1 Approval Principle
Permissions can require multi-party approval, independent of clearance levels.
- **Visibility:** A permission requiring approval must also be granted in an `access` block.
- **SoD:** The initiator of an action cannot be an approver for that same request.
- **Authority:** Approver authority is defined via `approvable_actions` in roles.

### 9.2 Approval Workflow
1. **Initiation:** Operation is held in "Pending" status if approval is required.
2. **Quorum:** Required number of unique authorized approvers must validate the request.
3. **Execution:** Once quorum is met and constraints (time/operation limits) are satisfied, the operation executes.

### 9.3 YAML Structure for Action-Based Approvals
Actions can define an `approvals` block to enforce these rules. Approvals can be triggered for specific permissions within that action:
```yaml
actions:
  - id: ActionName
    approvals:
      - permissions: [delete] # Specific permissions requiring approval
        required_approvers: 2
        valid_duration: 4h    # Optional: Time-bound approval
        max_operations: 1     # Optional: Bound to number of operations
```

## 10. Implementation Considerations (Future Extensions)
While this specification focuses on the core RBAC & LBAC framework, specialized operations such as Backup & Restore should be treated as extensions of the base Read and Write models:
- **Backup as a Read Extension:** Operations that export data for preservation should follow Read Operation rules (Clearance ≥ Severity) and may require additional encryption layers.
- **Restore as a Write Extension:** Operations that re-inject data into the system should follow Write Operation rules (Clearance == Severity) and may require elevated approval workflows to prevent integrity pollution from stale or external data sources.
- **Security for Archives:** Protective secrets or passwords for data protection should be managed by users whose clearance exactly matches the sensitivity level of the data being protected.

## 11. Ownership
- Users are granted `all` permissions on resources where their ID matches the `:owner` placeholder.
- Subject to Biba "No Write Up" rules.
