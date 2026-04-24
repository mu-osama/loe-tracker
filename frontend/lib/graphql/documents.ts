import { gql } from '@apollo/client';

export const LOGIN_MUTATION = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      user {
        id
        email
        name
        role
      }
    }
  }
`;

export const LOGOUT_MUTATION = gql`
  mutation Logout {
    logout
  }
`;

export const ME_QUERY = gql`
  query Me {
    me {
      id
      email
      name
      role
      position
      department
      country
      city
      reviewerId
    }
  }
`;

export const LOE_SHEET_QUERY = gql`
  query LoeSheet($year: Int!, $month: Int!, $userId: ID) {
    loeSheet(year: $year, month: $month, userId: $userId) {
      id
      userId
      user {
        id
        name
        email
      }
      year
      month
      status
      isDelayed
      submittedAt
      approvedAt
      reviewerId
      reviewer {
        id
        name
        email
      }
      reopenComment
      utilizationPercent
      totalHours
      entries {
        id
        date
        hours
        note
        project { id name code }
        fixedCategory { id name code }
      }
    }
  }
`;

export const LOE_SHEETS_QUERY = gql`
  query LoeSheets {
    loeSheets {
      id
      year
      month
      status
      isDelayed
      totalHours
      utilizationPercent
      submittedAt
      approvedAt
    }
  }
`;

export const PENDING_REVIEW_SHEETS_QUERY = gql`
  query PendingReviewSheets {
    pendingReviewSheets {
      id
      year
      month
      status
      isDelayed
      totalHours
      utilizationPercent
      submittedAt
      approvedAt
      user {
        id
        name
        email
      }
      reviewer {
        id
        name
        email
      }
    }
  }
`;

export const REVIEW_SHEETS_QUERY = gql`
  query ReviewSheets {
    reviewSheets {
      id
      year
      month
      status
      isDelayed
      totalHours
      utilizationPercent
      submittedAt
      approvedAt
      user {
        id
        name
        email
      }
      reviewer {
        id
        name
        email
      }
    }
  }
`;

export const PROJECTS_QUERY = gql`
  query Projects($includeInactive: Boolean) {
    projects(includeInactive: $includeInactive) {
      id
      name
      code
      description
      isActive
    }
  }
`;

export const CREATE_PROJECT_MUTATION = gql`
  mutation CreateProject($input: CreateProjectInput!) {
    createProject(input: $input) {
      id
      name
      code
      description
      isActive
    }
  }
`;

export const UPDATE_PROJECT_MUTATION = gql`
  mutation UpdateProject($id: ID!, $input: UpdateProjectInput!) {
    updateProject(id: $id, input: $input) {
      id
      name
      code
      description
      isActive
    }
  }
`;

export const DEACTIVATE_PROJECT_MUTATION = gql`
  mutation DeactivateProject($id: ID!) {
    deactivateProject(id: $id) {
      id
      isActive
    }
  }
`;

export const FIXED_CATEGORIES_QUERY = gql`
  query FixedCategories {
    fixedCategories {
      id
      name
      code
    }
  }
`;

export const USERS_QUERY = gql`
  query Users($filter: UserFilterInput) {
    users(filter: $filter) {
      id
      name
      email
      role
      position
      department
      country
      city
      reviewerId
      isActive
    }
  }
`;

export const USER_QUERY = gql`
  query User($id: ID!) {
    user(id: $id) {
      id
      name
      email
      role
      position
      department
      country
      city
      reviewerId
      isActive
    }
  }
`;

export const CREATE_USER_MUTATION = gql`
  mutation CreateUser($input: CreateUserInput!) {
    createUser(input: $input) {
      id
      name
      email
      role
      position
      department
      reviewerId
      country
      city
      isActive
    }
  }
`;

export const UPDATE_USER_MUTATION = gql`
  mutation UpdateUser($id: ID!, $input: UpdateUserInput!) {
    updateUser(id: $id, input: $input) {
      id
      name
      email
      role
      position
      department
      reviewerId
      country
      city
      isActive
    }
  }
`;

export const DEACTIVATE_USER_MUTATION = gql`
  mutation DeactivateUser($id: ID!) {
    deactivateUser(id: $id) {
      id
      isActive
    }
  }
`;

export const ALLOCATIONS_QUERY = gql`
  query Allocations($userId: ID) {
    allocations(userId: $userId) {
      id
      userId
      projectId
      assignedById
      percentage
      isActive
      user { id name email }
      project { id name code }
      assignedBy { id name email }
    }
  }
`;

export const CREATE_ALLOCATION_MUTATION = gql`
  mutation CreateAllocation($input: CreateAllocationInput!) {
    createAllocation(input: $input) {
      id
      userId
      projectId
      assignedById
      percentage
      isActive
      user { id name email }
      project { id name code }
      assignedBy { id name email }
    }
  }
`;

export const UPDATE_ALLOCATION_MUTATION = gql`
  mutation UpdateAllocation($id: ID!, $input: UpdateAllocationInput!) {
    updateAllocation(id: $id, input: $input) {
      id
      userId
      projectId
      assignedById
      percentage
      isActive
      user { id name email }
      project { id name code }
      assignedBy { id name email }
    }
  }
`;

export const DEACTIVATE_ALLOCATION_MUTATION = gql`
  mutation DeactivateAllocation($id: ID!) {
    deactivateAllocation(id: $id) {
      id
      assignedById
      isActive
      assignedBy { id name email }
    }
  }
`;

export const ADMIN_OVERVIEW_QUERY = gql`
  query AdminLoeOverview(
    $year: Int!
    $month: Int!
    $country: String
    $city: String
    $status: LoeStatus
    $overUtilized: Boolean
  ) {
    adminLoeOverview(
      year: $year
      month: $month
      country: $country
      city: $city
      status: $status
      overUtilized: $overUtilized
    ) {
      id
      year
      month
      status
      isDelayed
      totalHours
      utilizationPercent
      submittedAt
      approvedAt
      reviewer {
        id
        name
        email
      }
      user {
        id
        name
        email
        country
        city
      }
    }
  }
`;

export const REALTIME_EVENT_SUBSCRIPTION = gql`
  subscription RealtimeEvent(
    $topics: [String!]
    $userId: ID
    $reviewerId: ID
    $year: Int
    $month: Int
  ) {
    realtimeEvent(
      topics: $topics
      userId: $userId
      reviewerId: $reviewerId
      year: $year
      month: $month
    ) {
      topic
      entityId
      userId
      reviewerId
      year
      month
      title
      message
      link
    }
  }
`;

export const NOTIFICATIONS_QUERY = gql`
  query Notifications($limit: Int) {
    notifications(limit: $limit) {
      unreadCount
      items {
        id
        recipientId
        title
        message
        link
        type
        isRead
        createdAt
      }
    }
  }
`;

export const MARK_NOTIFICATION_READ_MUTATION = gql`
  mutation MarkNotificationRead($notificationId: ID!) {
    markNotificationRead(notificationId: $notificationId) {
      id
      isRead
    }
  }
`;

export const MARK_ALL_NOTIFICATIONS_READ_MUTATION = gql`
  mutation MarkAllNotificationsRead {
    markAllNotificationsRead
  }
`;

export const SAVE_DAY_ENTRIES_MUTATION = gql`
  mutation SaveDayEntries($year: Int!, $month: Int!, $day: Int!, $entries: [DayEntryInput!]!) {
    saveDayEntries(year: $year, month: $month, day: $day, entries: $entries) {
      id
      status
      utilizationPercent
    }
  }
`;

export const SUBMIT_LOE_MUTATION = gql`
  mutation SubmitLoe($loeSheetId: ID!) {
    submitLoe(loeSheetId: $loeSheetId) {
      id
      status
      submittedAt
    }
  }
`;

export const APPROVE_LOE_MUTATION = gql`
  mutation ApproveLoe($loeSheetId: ID!) {
    approveLoe(loeSheetId: $loeSheetId) {
      id
      status
      approvedAt
    }
  }
`;

export const REOPEN_LOE_MUTATION = gql`
  mutation ReopenLoe($loeSheetId: ID!, $comment: String!) {
    reopenLoe(loeSheetId: $loeSheetId, comment: $comment) {
      id
      status
      reopenComment
    }
  }
`;
