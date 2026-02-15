# RBAC & LBAC System Specification

## 1. Overview
The RBAC (Role-Based Access Control) system is enhanced with LBAC (Lattice-Based Access Control) concepts to provide a robust, hierarchical, and security-principled authorization framework. It integrates the Biba Integrity Model and Data Visibility levels to ensure data integrity and confidentiality.

## 2. Core Security Principles
- **Least Privilege:** Users are granted the minimum level of access required to perform their functions.
- **Need to Know:** Access is restricted to data necessary for a specific task, even if a user has a high clearance level.
- **Biba Integrity Model:**
  - **No Read Down:** A user can only read data at or above their clearance level (ensuring they don't rely on low-integrity data). *Note: In this implementation, this is adapted to ensure users don't access data beyond their sensitivity clearance.*
  - **No Write Up:** A user can only write data at their own clearance level to prevent "polluting" higher-integrity levels with lower-integrity data.

## 3. Permission Model
### Standard Permissions
- `create` (Synonyms: `add`, `post`)
- `read` (Synonyms: `view`, `get`, `print`, `share`, `export`, `backup`)
- `restore` (Synonyms: `recover`, `import`)
- `update` (Synonyms: `edit`, `put`, `patch`)
- `delete` (Synonyms: `remove`, `destroy`)

### Special Permissions
- `all`: Grants all standard permissions.
- `none`: Explicitly denies all permissions (used in scopes to override role permissions).

## 4. Sensitivity & Clearance
### 4.1 Sensitivity Levels (Resources)
Resources within actions are assigned a sensitivity level:
1. `Public`: Accessible to everyone.
2. `Protected`: Internal data, requires standard authentication.
3. `Restricted`: Sensitive data, requires specific authorization.
4. `Confidential`: Highly sensitive data, restricted to specific roles.
5. `Secret`: Critical data, maximum restriction.

Protected is the default level if not specified in the configuration.

### 4.2 Clearance Levels (Users)
A user's clearance level determines their ability to interact with resources based on the Biba Integrity Model:
- **Read Operations:** User Clearance ≥ Resource Severity (No Read Down).
- **Write Operations:** User Clearance == Resource Severity (No Write Up).

#### Clearance Assignment Rules
To prevent unauthorized escalation and maintain integrity, the following rules apply when assigning clearance levels to users or resources:
1. **Self-Assignment:** A user cannot assign a clearance level to another user or a sensitivity level to a resource that exceeds their own clearance level.
2. **Approval Process:** If a user needs to assign a level higher than their own clearance (e.g., an Admin with `Confidential` clearance setting up a `Secret` resource), an approval process must be initiated as defined in Section 9.
3. **Lower-Level Assignment:** A user can assign a clearance level to another user or a sensitivity level to a resource that is lower than their own current clearance, as this does not violate the Biba Integrity Model (it is an integrity downgrade, not an escalation).
4. **Audit Logging:** All assignments where the target level differs from the assignor's level must be explicitly logged with the assignor's ID and the justification.

### 4.3 Permission-Specific & Backup Rules
To maintain integrity and security, specific rules apply to different permission types:

- **Read Operations:** (`read`, `view`, `get`, `print`, `share`, `export`, `backup`).
  - **Rule:** User Clearance ≥ Resource Severity (No Read Down).
  - **Backup:** A user can only backup data where they meet the read clearance requirement. Authorization engines must evaluate this at the individual resource level during batch processes. Resources lacking clearance must be excluded or encrypted.


- **Write Operations:** (`create`, `add`, `update`, `edit`, `delete`, `remove`, `restore`, `recover`, `import`).
  - **Rule:** User Clearance == Resource Severity (No Write Up).
  - **Create/Delete:** Strict equality ensures only authorized users at a specific integrity level can perform constructive or destructive actions.
  - **Restore:** Treated as a unified high-integrity Write Operation. Even though it's a composite of other actions, it requires strict clearance equality to prevent integrity pollution.

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
        - permissions: [delete, restore]
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
          permissions: [restore] # Optional: Specific permissions
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
6. **Recursive Wildcard (`**`):** `org/**` matches `org/any/depth/resource`. Using `/**` at the end of a path is redundant but supported for clarity.

### 8.4 Conflicts
If multiple actions of the same precedence match (e.g., two different actions both defining `org/**`), their permissions and visibility levels are **aggregated** for roles (Enhancement Rule) and **intersected** for scopes.

## 9. Separation of Duties & Approvals
To maintain high integrity and prevent unauthorized high-sensitivity modifications, the system implements a Separation of Duties (SoD) through an approval workflow.

### 9.1 Approval Principle
Every permission within an action can be explicitly assigned a multi-party approval process, independent of the user's sensitivity or clearance levels. This is implemented via `approvals` configuration within Actions.

A permission that requires approval must be explicitly listed in at least one of the `access` permissions for that action. If a permission is marked for approval but is not granted in any `access` block, it cannot be exercised even with approval.

To maintain strict Separation of Duties, the initiator of an action cannot also be an approver for that same request, even if they possess an authorized approver role. The initiator is excluded from the quorum.

The authority to grant approvals is defined within roles via the `approvable_actions` property, establishing which roles can act as approvers for specific actions and permissions. The role needs also the ability to process the action itself. This ensures that the approver has the necessary permissions to approve the action. Actions are inherited from parent roles.

### 9.2 Approval Workflow
1. **Initiation:** A user initiates an operation (Read or Write). If the operation is marked as requiring approval, the workflow is triggered.
2. **Quorum:** The action is held in a "Pending" state until the required number of unique approvers (defined by role authority) validate the request. The initiator is excluded from the quorum.
3. **Constraints:** Approvals are time-bound (e.g., valid for 4 hours) or bound to a specific number of operations (e.g., valid for 1 execution).
4. **Execution:** Once the quorum is met, constraints are satisfied, and any required authorizations are provided, the operation is executed. For read operations of higher sensitivity, LoDV (Level of Data Visibility) masks are applied by the application layer based on the initiator's actual clearance, even if the operation is approved.

### 9.3 YAML Structure for Action-Based Approvals
Actions can define an `approvals` block to enforce these rules. Approvals can be triggered for specific permissions within that action:
```yaml
actions:
  - id: ActionName
    approvals:
      - permissions: [delete, restore] # Specific permissions requiring approval
        required_approvers: 2
        valid_duration: 4h    # Optional: Time-bound approval
        max_operations: 1     # Optional: Bound to number of operations
```

## 10. Data Protection (Backup & Restore)
To ensure security during data protection operations and prevent unauthorized access to sensitive archives.

### 10.1 Backup/Restore Passwords & Secrets
Before a backup can be started for any sensitivity level, a password or secret must be set to protect the archive.
- **Identical Clearance Requirement:** The password/secret for a specific sensitivity level can only be configured or setup by users who have a clearance level exactly matching that sensitivity level.
- **Encryption/Salting:** The secret is used to encrypt/decrypt or salt the data during the backup and restore processes.

### 10.2 Operational Rules
- **`backup`:** Categorized as a **Read Operation**. A user can only backup data where their Clearance ≥ Resource Severity.
- **`restore`:** Categorized as a **Write Operation**. A user can only restore data where their Clearance == Resource Severity.
  - **Approval Override:** If a user does not have the required clearance for a `restore` operation (i.e., User Clearance != Resource Severity), an approval process must be initiated as defined in Section 9.
- **Enforcement:** Authorization engines must evaluate permissions at the individual resource level. If a backup job encounters a resource for which the initiator lacks clearance, that resource must be excluded from the archive or protected with a secret the initiator does not possess.

## 11. Ownership
- Users are granted `all` permissions on resources where their ID matches the `:owner` placeholder.
- Subject to Biba "No Write Up" rules.
