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
- `update` (Synonyms: `edit`, `put`, `patch`)
- `delete` (Synonyms: `remove`, `destroy`)

### Special Permissions
- `all`: Grants all standard permissions.
- `none`: Explicitly denies all permissions (used in scopes to override role permissions).

## 4. Sensitivity & Clearance
### Severity Levels (Resources)
Resources are assigned a severity level that defines their sensitivity:
1. `Public`: Accessible to everyone.
2. `Protected`: Internal data, requires standard authentication.
3. `Restricted`: Sensitive data, requires specific authorization.
4. `Confidential`: Highly sensitive data, restricted to specific roles.
5. `Secret`: Critical data, maximum restriction.

### Clearance Levels (Users)
A user's clearance level determines their ability to interact with resources:
- **Read Operations:** User Clearance ≥ Resource Severity.
- **Write Operations:** User Clearance == Resource Severity.

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
### Actions
Reusable-named templates that map resources to permission-severity pairs.
- Support multiple severity levels per resource.
- Define visibility levels (LoDV) for each severity.
- **YAML Structure:**
  ```yaml
  actions:
    - id: ActionName
      resource: path/to/resource
      access:
        - severity: SeverityLevel
          permissions: [perm1, perm2]
          visibility: VisibilityState
  ```

### Roles
Aggregations of Actions.
- **Single Inheritance:** A role can have one parent.
- **Enhancement Rule:** Child roles add to or refine parent permissions; they cannot reduce them.
- **YAML Structure:**
  ```yaml
  roles:
    - id: RoleName
      parent: ParentRoleName # Optional
      actions:
        - ActionName
  ```

### Scopes
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

### Users
Assignments of users to roles, clearance levels, and optional scopes. User configuration defines how individuals are mapped to the authorization model.
- **Clearance level:** Determines the user's ability to read and write data based on resource severity (Biba Integrity Model).
- **Roles:** A list of roles assigned to the user. Permissions from all assigned roles are aggregated.
- **Scope:** An optional temporary intersection mask. Only one scope can be active at a time to limit effective permissions.
- **YAML Structure:**
  ```yaml
  users:
    - id: UserID
      name: UserName
      clearance: ClearanceLevel
      roles: [Role1, Role2]
      scope: ScopeName # Optional
  ```

### Ownership
- Users are granted `all` permissions on resources where their ID matches the `:owner` placeholder.
- Subject to Biba "No Write Up" rules.
