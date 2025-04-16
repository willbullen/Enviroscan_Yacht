# Comprehensive Improvement Prompt for Eastwind Yacht Management App

## Overview
This prompt provides detailed instructions for improving the Eastwind Yacht Management application in Replit. The improvements focus on fixing errors, enhancing functionality, and refining the user interface and experience based on a thorough analysis of the current application.

## Core Objectives
1. Fix identified functional errors and bugs
2. Improve the user interface and experience
3. Enhance existing functionality
4. Optimize performance and responsiveness
5. Ensure cross-browser and cross-device compatibility

## Technical Approach

### Code Structure Improvements
```javascript
// Implement a more organized project structure
// Example folder structure:
// - components/ (reusable UI components)
//   - common/ (buttons, cards, inputs, etc.)
//   - layout/ (navigation, header, footer)
//   - sections/ (section-specific components)
// - pages/ (page components)
// - hooks/ (custom React hooks)
// - utils/ (utility functions)
// - services/ (API and data services)
// - context/ (React context providers)
// - styles/ (global styles and themes)

// Create a consistent component pattern
// Example component structure:
function TaskCard({ task, onStatusChange, onEdit }) {
  // State management
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Event handlers
  const handleStatusChange = (newStatus) => {
    // Validation and error handling
    if (!newStatus) return;
    
    // Call parent handler
    onStatusChange(task.id, newStatus);
  };
  
  // Render helpers
  const renderPriorityBadge = () => {
    return <Badge variant={task.priority === 'High' ? 'danger' : 'warning'}>{task.priority}</Badge>;
  };
  
  // Component rendering
  return (
    <Card className="task-card">
      <Card.Header>
        <div className="d-flex justify-content-between align-items-center">
          <h5>{task.title}</h5>
          {renderPriorityBadge()}
        </div>
      </Card.Header>
      <Card.Body>
        {/* Task details */}
      </Card.Body>
      <Card.Footer>
        {/* Action buttons */}
      </Card.Footer>
    </Card>
  );
}
```

### State Management Improvements
```javascript
// Implement consistent state management
// Example using React Context:
const TasksContext = createContext();

function TasksProvider({ children }) {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Fetch tasks
  const fetchTasks = async (filters = {}) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.getTasks(filters);
      setTasks(response.data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching tasks:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Add task
  const addTask = async (taskData) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.createTask(taskData);
      setTasks(prevTasks => [...prevTasks, response.data]);
      return response.data;
    } catch (err) {
      setError(err.message);
      console.error('Error adding task:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Update task
  const updateTask = async (taskId, taskData) => {
    // Implementation
  };
  
  // Delete task
  const deleteTask = async (taskId) => {
    // Implementation
  };
  
  return (
    <TasksContext.Provider value={{
      tasks,
      isLoading,
      error,
      fetchTasks,
      addTask,
      updateTask,
      deleteTask
    }}>
      {children}
    </TasksContext.Provider>
  );
}

// Custom hook for using the context
function useTasks() {
  const context = useContext(TasksContext);
  if (!context) {
    throw new Error('useTasks must be used within a TasksProvider');
  }
  return context;
}
```

### API and Data Handling
```javascript
// Create a robust API service
// api.js
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add authentication token if available
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle common errors
    if (error.response) {
      // Server responded with error status
      if (error.response.status === 401) {
        // Unauthorized - redirect to login
        window.location.href = '/login';
      }
    } else if (error.request) {
      // Request made but no response received
      console.error('Network error:', error.request);
    } else {
      // Error setting up request
      console.error('Request error:', error.message);
    }
    return Promise.reject(error);
  }
);

// API methods
export const taskService = {
  getTasks: (filters = {}) => api.get('/tasks', { params: filters }),
  getTaskById: (id) => api.get(`/tasks/${id}`),
  createTask: (data) => api.post('/tasks', data),
  updateTask: (id, data) => api.put(`/tasks/${id}`, data),
  deleteTask: (id) => api.delete(`/tasks/${id}`)
};

export const equipmentService = {
  // Equipment-related API methods
};

// Export all services
export default {
  tasks: taskService,
  equipment: equipmentService,
  // Other services
};
```

### Error Handling and Validation
```javascript
// Form validation with error handling
// Example using Formik and Yup
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';

// Validation schema
const taskValidationSchema = Yup.object().shape({
  title: Yup.string()
    .required('Task title is required')
    .max(100, 'Title must be less than 100 characters'),
  description: Yup.string()
    .max(500, 'Description must be less than 500 characters'),
  dueDate: Yup.date()
    .required('Due date is required')
    .min(new Date(), 'Due date cannot be in the past'),
  equipmentId: Yup.string()
    .required('Equipment selection is required'),
  assignedTo: Yup.string()
    .required('Task must be assigned to someone'),
  estimatedDuration: Yup.number()
    .required('Estimated duration is required')
    .positive('Duration must be positive')
    .integer('Duration must be a whole number')
});

function TaskForm({ initialValues, onSubmit }) {
  return (
    <Formik
      initialValues={initialValues || {
        title: '',
        description: '',
        dueDate: '',
        equipmentId: '',
        assignedTo: '',
        estimatedDuration: 0,
        priority: 'Medium'
      }}
      validationSchema={taskValidationSchema}
      onSubmit={async (values, { setSubmitting, setStatus }) => {
        try {
          await onSubmit(values);
          setStatus({ success: true });
        } catch (error) {
          setStatus({ success: false, error: error.message });
        } finally {
          setSubmitting(false);
        }
      }}
    >
      {({ isSubmitting, status }) => (
        <Form className="task-form">
          {status && status.error && (
            <Alert variant="danger">{status.error}</Alert>
          )}
          
          <div className="form-group">
            <label htmlFor="title">Task Title</label>
            <Field name="title" type="text" className="form-control" />
            <ErrorMessage name="title" component="div" className="text-danger" />
          </div>
          
          {/* Other form fields */}
          
          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Task'}
          </button>
        </Form>
      )}
    </Formik>
  );
}
```

## UI/UX Improvements

### Design System Implementation
```javascript
// Create a design system with consistent components
// Example using styled-components

// Theme definition
export const theme = {
  colors: {
    primary: '#0056b3',
    secondary: '#6c757d',
    success: '#28a745',
    danger: '#dc3545',
    warning: '#ffc107',
    info: '#17a2b8',
    light: '#f8f9fa',
    dark: '#343a40',
    white: '#ffffff',
    background: '#f5f7fa'
  },
  typography: {
    fontFamily: "'Roboto', 'Helvetica Neue', Arial, sans-serif",
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      md: '1rem',
      lg: '1.25rem',
      xl: '1.5rem',
      xxl: '2rem'
    },
    fontWeight: {
      light: 300,
      regular: 400,
      medium: 500,
      bold: 700
    },
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      loose: 1.75
    }
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    xxl: '3rem'
  },
  breakpoints: {
    xs: '0px',
    sm: '576px',
    md: '768px',
    lg: '992px',
    xl: '1200px'
  },
  shadows: {
    sm: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
    md: '0 3px 6px rgba(0,0,0,0.15), 0 2px 4px rgba(0,0,0,0.12)',
    lg: '0 10px 20px rgba(0,0,0,0.15), 0 3px 6px rgba(0,0,0,0.10)',
    xl: '0 15px 25px rgba(0,0,0,0.15), 0 5px 10px rgba(0,0,0,0.05)'
  },
  borderRadius: {
    sm: '0.25rem',
    md: '0.5rem',
    lg: '1rem',
    pill: '50rem'
  }
};

// Button component
const Button = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: ${props => props.size === 'sm' ? props.theme.spacing.xs : props.size === 'lg' ? props.theme.spacing.lg : props.theme.spacing.md} ${props => props.size === 'sm' ? props.theme.spacing.md : props.size === 'lg' ? props.theme.spacing.xl : props.theme.spacing.lg};
  font-size: ${props => props.size === 'sm' ? props.theme.typography.fontSize.sm : props.size === 'lg' ? props.theme.typography.fontSize.lg : props.theme.typography.fontSize.md};
  font-weight: ${props => props.theme.typography.fontWeight.medium};
  line-height: ${props => props.theme.typography.lineHeight.normal};
  text-align: center;
  text-decoration: none;
  vertical-align: middle;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  user-select: none;
  border: 1px solid transparent;
  border-radius: ${props => props.theme.borderRadius.md};
  transition: color 0.15s ease-in-out, background-color 0.15s ease-in-out, border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
  
  /* Variant styles */
  background-color: ${props => props.variant ? props.theme.colors[props.variant] : props.theme.colors.primary};
  color: ${props => ['light', 'warning'].includes(props.variant) ? props.theme.colors.dark : props.theme.colors.white};
  
  &:hover {
    background-color: ${props => {
      if (props.disabled) return props.variant ? props.theme.colors[props.variant] : props.theme.colors.primary;
      const color = props.variant ? props.theme.colors[props.variant] : props.theme.colors.primary;
      return darken(0.1, color);
    }};
  }
  
  &:focus {
    outline: 0;
    box-shadow: 0 0 0 0.25rem ${props => {
      const color = props.variant ? props.theme.colors[props.variant] : props.theme.colors.primary;
      return transparentize(0.5, color);
    }};
  }
  
  &:disabled {
    opacity: 0.65;
  }
  
  /* Icon spacing */
  svg {
    margin-right: ${props => props.iconOnly ? '0' : props.theme.spacing.xs};
  }
`;

// Card component
const Card = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  min-width: 0;
  word-wrap: break-word;
  background-color: ${props => props.theme.colors.white};
  background-clip: border-box;
  border: 1px solid rgba(0, 0, 0, 0.125);
  border-radius: ${props => props.theme.borderRadius.md};
  box-shadow: ${props => props.elevated ? props.theme.shadows.md : 'none'};
  transition: box-shadow 0.3s ease;
  
  &:hover {
    box-shadow: ${props => props.hoverable ? props.theme.shadows.lg : props.elevated ? props.theme.shadows.md : 'none'};
  }
`;

Card.Header = styled.div`
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.lg};
  margin-bottom: 0;
  background-color: rgba(0, 0, 0, 0.03);
  border-bottom: 1px solid rgba(0, 0, 0, 0.125);
  
  &:first-child {
    border-radius: calc(${props => props.theme.borderRadius.md} - 1px) calc(${props => props.theme.borderRadius.md} - 1px) 0 0;
  }
`;

Card.Body = styled.div`
  flex: 1 1 auto;
  padding: ${props => props.theme.spacing.lg};
`;

Card.Footer = styled.div`
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.lg};
  background-color: rgba(0, 0, 0, 0.03);
  border-top: 1px solid rgba(0, 0, 0, 0.125);
  
  &:last-child {
    border-radius: 0 0 calc(${props => props.theme.borderRadius.md} - 1px) calc(${props => props.theme.borderRadius.md} - 1px);
  }
`;
```

### Responsive Layout Implementation
```javascript
// Implement responsive grid system
// Example using styled-components
const Container = styled.div`
  width: 100%;
  padding-right: ${props => props.theme.spacing.md};
  padding-left: ${props => props.theme.spacing.md};
  margin-right: auto;
  margin-left: auto;
  
  @media (min-width: ${props => props.theme.breakpoints.sm}) {
    max-width: 540px;
  }
  
  @media (min-width: ${props => props.theme.breakpoints.md}) {
    max-width: 720px;
  }
  
  @media (min-width: ${props => props.theme.breakpoints.lg}) {
    max-width: 960px;
  }
  
  @media (min-width: ${props => props.theme.breakpoints.xl}) {
    max-width: 1140px;
  }
`;

const Row = styled.div`
  display: flex;
  flex-wrap: wrap;
  margin-right: -${props => props.theme.spacing.md};
  margin-left: -${props => props.theme.spacing.md};
`;

const Col = styled.div`
  position: relative;
  width: 100%;
  padding-right: ${props => props.theme.spacing.md};
  padding-left: ${props => props.theme.spacing.md};
  
  ${props => {
    if (props.xs) {
      return `
        flex: 0 0 ${(props.xs / 12) * 100}%;
        max-width: ${(props.xs / 12) * 100}%;
      `;
    }
    return '';
  }}
  
  @media (min-width: ${props => props.theme.breakpoints.sm}) {
    ${props => {
      if (props.sm) {
        return `
          flex: 0 0 ${(props.sm / 12) * 100}%;
          max-width: ${(props.sm / 12) * 100}%;
        `;
      }
      return '';
    }}
  }
  
  @media (min-width: ${props => props.theme.breakpoints.md}) {
    ${props => {
      if (props.md) {
        return `
          flex: 0 0 ${(props.md / 12) * 100}%;
          max-width: ${(props.md / 12) * 100}%;
        `;
      }
      return '';
    }}
  }
  
  @media (min-width: ${props => props.theme.breakpoints.lg}) {
    ${props => {
      if (props.lg) {
        return `
          flex: 0 0 ${(props.lg / 12) * 100}%;
          max-width: ${(props.lg / 12) * 100}%;
        `;
      }
      return '';
    }}
  }
  
  @media (min-width: ${props => props.theme.breakpoints.xl}) {
    ${props => {
      if (props.xl) {
        return `
          flex: 0 0 ${(props.xl / 12) * 100}%;
          max-width: ${(props.xl / 12) * 100}%;
        `;
      }
      return '';
    }}
  }
`;

// Example usage
function DashboardLayout() {
  return (
    <Container>
      <Row>
        <Col xs={12} lg={8}>
          <MainContent />
        </Col>
        <Col xs={12} lg={4}>
          <Sidebar />
        </Col>
      </Row>
    </Container>
  );
}
```

### Navigation Improvements
```javascript
// Implement improved navigation with active state
function Navigation() {
  const location = useLocation();
  
  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };
  
  return (
    <nav className="sidebar">
      <div className="sidebar-header">
        <img src="/logo.png" alt="Eastwind Management" className="logo" />
      </div>
      
      <div className="sidebar-content">
        <ul className="nav-items">
          <li className={`nav-item ${isActive('/') ? 'active' : ''}`}>
            <Link to="/" className="nav-link">
              <DashboardIcon />
              <span>Dashboard</span>
            </Link>
          </li>
          
          <li className={`nav-item ${isActive('/tasks') ? 'active' : ''}`}>
            <Link to="/tasks" className="nav-link">
              <TasksIcon />
              <span>Tasks</span>
            </Link>
          </li>
          
          <li className={`nav-item ${isActive('/equipment') ? 'active' : ''}`}>
            <Link to="/equipment" className="nav-link">
              <EquipmentIcon />
              <span>Equipment</span>
            </Link>
          </li>
          
          {/* Other navigation items */}
        </ul>
      </div>
      
      <div className="sidebar-footer">
        <div className="user-info">
          <img src="/avatar.png" alt="User" className="avatar" />
          <div className="user-details">
            <span className="user-name">Capt. Smith</span>
            <span className="user-role">Administrator</span>
          </div>
        </div>
      </div>
    </nav>
  );
}
```

### Notification System
```javascript
// Implement a notification system
// Notification context
const NotificationContext = createContext();

function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  
  // Add notification
  const addNotification = (notification) => {
    const id = Date.now();
    const newNotification = {
      id,
      title: notification.title || 'Notification',
      message: notification.message,
      type: notification.type || 'info',
      duration: notification.duration || 5000,
      read: false,
      timestamp: new Date()
    };
    
    setNotifications(prev => [newNotification, ...prev]);
    
    // Auto dismiss if not persistent
    if (notification.persistent !== true) {
      setTimeout(() => {
        dismissNotification(id);
      }, newNotification.duration);
    }
    
    return id;
  };
  
  // Dismiss notification
  const dismissNotification = (id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };
  
  // Mark notification as read
  const markAsRead = (id) => {
    setNotifications(prev => prev.map(notification => 
      notification.id === id ? { ...notification, read: true } : notification
    ));
  };
  
  // Mark all as read
  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notification => ({ ...notification, read: true })));
  };
  
  // Get unread count
  const unreadCount = notifications.filter(notification => !notification.read).length;
  
  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      addNotification,
      dismissNotification,
      markAsRead,
      markAllAsRead
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

// Notification component
function NotificationCenter() {
  const { notifications, unreadCount, dismissNotification, markAsRead, markAllAsRead } = useContext(NotificationContext);
  const [isOpen, setIsOpen] = useState(false);
  
  const toggleOpen = () => {
    setIsOpen(prev => !prev);
  };
  
  return (
    <div className="notification-center">
      <button className="notification-toggle" onClick={toggleOpen}>
        <BellIcon />
        {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
      </button>
      
      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>Notifications</h3>
            {unreadCount > 0 && (
              <button className="mark-all-read" onClick={markAllAsRead}>
                Mark all as read
              </button>
            )}
          </div>
          
          <div className="notification-list">
            {notifications.length === 0 ? (
              <div className="empty-state">No notifications</div>
            ) : (
              notifications.map(notification => (
                <div 
                  key={notification.id} 
                  className={`notification-item ${notification.read ? '' : 'unread'} ${notification.type}`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="notification-icon">
                    {notification.type === 'success' && <CheckCircleIcon />}
                    {notification.type === 'warning' && <AlertTriangleIcon />}
                    {notification.type === 'error' && <AlertOctagonIcon />}
                    {notification.type === 'info' && <InfoIcon />}
                  </div>
                  <div className="notification-content">
                    <div className="notification-title">{notification.title}</div>
                    <div className="notification-message">{notification.message}</div>
                    <div className="notification-time">
                      {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                    </div>
                  </div>
                  <button 
                    className="notification-dismiss" 
                    onClick={(e) => {
                      e.stopPropagation();
                      dismissNotification(notification.id);
                    }}
                  >
                    <XIcon />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Toast notifications
function ToastNotifications() {
  const { notifications, dismissNotification } = useContext(NotificationContext);
  
  // Only show non-read notifications that are recent (less than their duration old)
  const toastNotifications = notifications.filter(notification => {
    const ageInMs = Date.now() - notification.timestamp.getTime();
    return !notification.read && ageInMs < notification.duration;
  });
  
  return (
    <div className="toast-container">
      {toastNotifications.map(notification => (
        <div 
          key={notification.id} 
          className={`toast ${notification.type}`}
        >
          <div className="toast-header">
            {notification.type === 'success' && <CheckCircleIcon />}
            {notification.type === 'warning' && <AlertTriangleIcon />}
            {notification.type === 'error' && <AlertOctagonIcon />}
            {notification.type === 'info' && <InfoIcon />}
            <span className="toast-title">{notification.title}</span>
            <button 
              className="toast-dismiss" 
              onClick={() => dismissNotification(notification.id)}
            >
              <XIcon />
            </button>
          </div>
          <div className="toast-body">
            {notification.message}
          </div>
        </div>
      ))}
    </div>
  );
}
```

## Section-Specific Improvements

### Dashboard Improvements
```javascript
// Implement an improved dashboard with customizable widgets
function Dashboard() {
  const [layout, setLayout] = useState(getStoredLayout() || defaultLayout);
  
  // Save layout changes
  const handleLayoutChange = (newLayout) => {
    setLayout(newLayout);
    localStorage.setItem('dashboardLayout', JSON.stringify(newLayout));
  };
  
  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <div className="dashboard-actions">
          <Button variant="secondary" onClick={() => setEditMode(true)}>
            <EditIcon /> Customize Dashboard
          </Button>
          <Button variant="primary" onClick={() => refreshDashboardData()}>
            <RefreshIcon /> Refresh
          </Button>
        </div>
      </div>
      
      <div className="dashboard-content">
        <ResponsiveGridLayout
          className="layout"
          layouts={layout}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
          cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
          rowHeight={100}
          onLayoutChange={handleLayoutChange}
          isDraggable={editMode}
          isResizable={editMode}
        >
          <div key="tasks" className="dashboard-widget">
            <TasksWidget />
          </div>
          <div key="equipment" className="dashboard-widget">
            <EquipmentStatusWidget />
          </div>
          <div key="inventory" className="dashboard-widget">
            <InventoryWidget />
          </div>
          <div key="maintenance" className="dashboard-widget">
            <MaintenanceForecastWidget />
          </div>
          <div key="calendar" className="dashboard-widget">
            <UpcomingEventsWidget />
          </div>
        </ResponsiveGridLayout>
      </div>
    </div>
  );
}

// Example dashboard widget
function TasksWidget() {
  const { tasks, isLoading, error, fetchTasks } = useTasks();
  const [filter, setFilter] = useState('upcoming');
  
  useEffect(() => {
    fetchTasks({ status: filter });
  }, [fetchTasks, filter]);
  
  const getStatusCounts = () => {
    const counts = {
      due: 0,
      upcoming: 0,
      inProgress: 0,
      completed: 0
    };
    
    tasks.forEach(task => {
      if (task.status === 'due') counts.due++;
      else if (task.status === 'upcoming') counts.upcoming++;
      else if (task.status === 'in-progress') counts.inProgress++;
      else if (task.status === 'completed') counts.completed++;
    });
    
    return counts;
  };
  
  const statusCounts = getStatusCounts();
  
  return (
    <Card className="tasks-widget">
      <Card.Header>
        <h3>Maintenance Tasks</h3>
        <div className="widget-actions">
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All Tasks</option>
            <option value="due">Due</option>
            <option value="upcoming">Upcoming</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
          <Button variant="icon" onClick={() => fetchTasks({ status: filter })}>
            <RefreshIcon />
          </Button>
        </div>
      </Card.Header>
      <Card.Body>
        {isLoading ? (
          <Loader />
        ) : error ? (
          <ErrorMessage message={error} />
        ) : (
          <>
            <div className="status-summary">
              <div className="status-item due">
                <span className="count">{statusCounts.due}</span>
                <span className="label">Due</span>
              </div>
              <div className="status-item upcoming">
                <span className="count">{statusCounts.upcoming}</span>
                <span className="label">Upcoming</span>
              </div>
              <div className="status-item in-progress">
                <span className="count">{statusCounts.inProgress}</span>
                <span className="label">In Progress</span>
              </div>
              <div className="status-item completed">
                <span className="count">{statusCounts.completed}</span>
                <span className="label">Completed</span>
              </div>
            </div>
            
            <div className="task-list">
              {tasks.slice(0, 5).map(task => (
                <div key={task.id} className="task-item">
                  <div className="task-info">
                    <h4>{task.title}</h4>
                    <div className="task-meta">
                      <span className="equipment">{task.equipment}</span>
                      <span className="due-date">Due: {formatDate(task.dueDate)}</span>
                    </div>
                  </div>
                  <div className="task-status">
                    <Badge variant={
                      task.status === 'due' ? 'danger' :
                      task.status === 'upcoming' ? 'warning' :
                      task.status === 'in-progress' ? 'info' :
                      'success'
                    }>
                      {task.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </Card.Body>
      <Card.Footer>
        <Link to="/tasks" className="view-all">
          View All Tasks <ChevronRightIcon />
        </Link>
      </Card.Footer>
    </Card>
  );
}
```

### Tasks Improvements
```javascript
// Implement improved task management
function TasksPage() {
  const { tasks, isLoading, error, fetchTasks } = useTasks();
  const [viewMode, setViewMode] = useState('card'); // 'card' or 'list'
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('dueDate');
  const [sortDirection, setSortDirection] = useState('asc');
  
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);
  
  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    // Status filter
    if (filterStatus !== 'all' && task.status !== filterStatus) {
      return false;
    }
    
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        task.title.toLowerCase().includes(searchLower) ||
        task.description.toLowerCase().includes(searchLower) ||
        task.equipment.toLowerCase().includes(searchLower) ||
        (task.assignedTo && task.assignedTo.toLowerCase().includes(searchLower))
      );
    }
    
    return true;
  });
  
  // Sort tasks
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    let comparison = 0;
    
    if (sortField === 'dueDate') {
      comparison = new Date(a.dueDate) - new Date(b.dueDate);
    } else if (sortField === 'priority') {
      const priorityOrder = { 'High': 1, 'Medium': 2, 'Low': 3 };
      comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
    } else if (sortField === 'title') {
      comparison = a.title.localeCompare(b.title);
    } else if (sortField === 'equipment') {
      comparison = a.equipment.localeCompare(b.equipment);
    }
    
    return sortDirection === 'asc' ? comparison : -comparison;
  });
  
  // Toggle sort direction
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  return (
    <div className="tasks-page">
      <div className="page-header">
        <h1>Maintenance Tasks</h1>
        <div className="page-actions">
          <Button variant="primary" onClick={() => setShowNewTaskModal(true)}>
            <PlusIcon /> New Task
          </Button>
        </div>
      </div>
      
      <div className="filter-bar">
        <div className="search-box">
          <SearchIcon />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="clear-search" onClick={() => setSearchTerm('')}>
              <XIcon />
            </button>
          )}
        </div>
        
        <div className="filter-buttons">
          <Button 
            variant={filterStatus === 'all' ? 'primary' : 'outline-primary'}
            onClick={() => setFilterStatus('all')}
          >
            All Tasks
          </Button>
          <Button 
            variant={filterStatus === 'due' ? 'danger' : 'outline-danger'}
            onClick={() => setFilterStatus('due')}
          >
            Due
          </Button>
          <Button 
            variant={filterStatus === 'in-progress' ? 'info' : 'outline-info'}
            onClick={() => setFilterStatus('in-progress')}
          >
            In Progress
          </Button>
          <Button 
            variant={filterStatus === 'upcoming' ? 'warning' : 'outline-warning'}
            onClick={() => setFilterStatus('upcoming')}
          >
            Upcoming
          </Button>
          <Button 
            variant={filterStatus === 'completed' ? 'success' : 'outline-success'}
            onClick={() => setFilterStatus('completed')}
          >
            Completed
          </Button>
        </div>
        
        <div className="view-toggle">
          <Button 
            variant={viewMode === 'card' ? 'primary' : 'outline-primary'}
            onClick={() => setViewMode('card')}
          >
            <GridIcon />
          </Button>
          <Button 
            variant={viewMode === 'list' ? 'primary' : 'outline-primary'}
            onClick={() => setViewMode('list')}
          >
            <ListIcon />
          </Button>
        </div>
      </div>
      
      {isLoading ? (
        <Loader />
      ) : error ? (
        <ErrorMessage message={error} />
      ) : sortedTasks.length === 0 ? (
        <EmptyState
          icon={<ClipboardIcon size={48} />}
          title="No tasks found"
          description="Try changing your search or filter criteria, or create a new task."
          action={
            <Button variant="primary" onClick={() => setShowNewTaskModal(true)}>
              <PlusIcon /> New Task
            </Button>
          }
        />
      ) : viewMode === 'card' ? (
        <div className="task-grid">
          {sortedTasks.map(task => (
            <TaskCard 
              key={task.id} 
              task={task} 
              onStatusChange={handleStatusChange}
              onEdit={() => handleEditTask(task)}
            />
          ))}
        </div>
      ) : (
        <div className="task-table">
          <table>
            <thead>
              <tr>
                <th onClick={() => handleSort('title')}>
                  Title
                  {sortField === 'title' && (
                    sortDirection === 'asc' ? <ChevronUpIcon /> : <ChevronDownIcon />
                  )}
                </th>
                <th onClick={() => handleSort('equipment')}>
                  Equipment
                  {sortField === 'equipment' && (
                    sortDirection === 'asc' ? <ChevronUpIcon /> : <ChevronDownIcon />
                  )}
                </th>
                <th onClick={() => handleSort('dueDate')}>
                  Due Date
                  {sortField === 'dueDate' && (
                    sortDirection === 'asc' ? <ChevronUpIcon /> : <ChevronDownIcon />
                  )}
                </th>
                <th onClick={() => handleSort('priority')}>
                  Priority
                  {sortField === 'priority' && (
                    sortDirection === 'asc' ? <ChevronUpIcon /> : <ChevronDownIcon />
                  )}
                </th>
                <th>Assigned To</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedTasks.map(task => (
                <tr key={task.id}>
                  <td>{task.title}</td>
                  <td>{task.equipment}</td>
                  <td>{formatDate(task.dueDate)}</td>
                  <td>
                    <Badge variant={
                      task.priority === 'High' ? 'danger' :
                      task.priority === 'Medium' ? 'warning' :
                      'info'
                    }>
                      {task.priority}
                    </Badge>
                  </td>
                  <td>{task.assignedTo}</td>
                  <td>
                    <Badge variant={
                      task.status === 'due' ? 'danger' :
                      task.status === 'upcoming' ? 'warning' :
                      task.status === 'in-progress' ? 'info' :
                      'success'
                    }>
                      {task.status}
                    </Badge>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <Button variant="icon" onClick={() => handleEditTask(task)}>
                        <EditIcon />
                      </Button>
                      <Button variant="icon" onClick={() => handleViewTask(task)}>
                        <EyeIcon />
                      </Button>
                      <StatusDropdown 
                        currentStatus={task.status} 
                        onStatusChange={(status) => handleStatusChange(task.id, status)} 
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Task modals */}
      {showNewTaskModal && (
        <TaskModal
          isOpen={showNewTaskModal}
          onClose={() => setShowNewTaskModal(false)}
          onSubmit={handleCreateTask}
          title="Create New Task"
        />
      )}
      
      {editingTask && (
        <TaskModal
          isOpen={!!editingTask}
          onClose={() => setEditingTask(null)}
          onSubmit={(data) => handleUpdateTask(editingTask.id, data)}
          title="Edit Task"
          initialData={editingTask}
        />
      )}
      
      {viewingTask && (
        <TaskDetailModal
          isOpen={!!viewingTask}
          onClose={() => setViewingTask(null)}
          task={viewingTask}
          onStatusChange={handleStatusChange}
          onEdit={() => {
            setEditingTask(viewingTask);
            setViewingTask(null);
          }}
        />
      )}
    </div>
  );
}
```

### Equipment Improvements
```javascript
// Implement improved equipment management
function EquipmentPage() {
  const { equipment, isLoading, error, fetchEquipment } = useEquipment();
  const [viewMode, setViewMode] = useState('card');
  const [filterCategory, setFilterCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  useEffect(() => {
    fetchEquipment();
  }, [fetchEquipment]);
  
  // Filter equipment
  const filteredEquipment = equipment.filter(item => {
    // Category filter
    if (filterCategory !== 'all' && item.category !== filterCategory) {
      return false;
    }
    
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        item.name.toLowerCase().includes(searchLower) ||
        item.model.toLowerCase().includes(searchLower) ||
        item.serialNumber.toLowerCase().includes(searchLower) ||
        item.location.toLowerCase().includes(searchLower)
      );
    }
    
    return true;
  });
  
  // Get unique categories
  const categories = ['all', ...new Set(equipment.map(item => item.category))];
  
  return (
    <div className="equipment-page">
      <div className="page-header">
        <h1>Equipment</h1>
        <div className="page-actions">
          <Button variant="primary" onClick={() => setShowNewEquipmentModal(true)}>
            <PlusIcon /> Add Equipment
          </Button>
        </div>
      </div>
      
      <div className="filter-bar">
        <div className="search-box">
          <SearchIcon />
          <input
            type="text"
            placeholder="Search equipment..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="clear-search" onClick={() => setSearchTerm('')}>
              <XIcon />
            </button>
          )}
        </div>
        
        <div className="category-filter">
          {categories.map(category => (
            <Button
              key={category}
              variant={filterCategory === category ? 'primary' : 'outline-primary'}
              onClick={() => setFilterCategory(category)}
            >
              {category === 'all' ? 'All Equipment' : category}
            </Button>
          ))}
        </div>
        
        <div className="view-toggle">
          <Button 
            variant={viewMode === 'card' ? 'primary' : 'outline-primary'}
            onClick={() => setViewMode('card')}
          >
            <GridIcon />
          </Button>
          <Button 
            variant={viewMode === 'list' ? 'primary' : 'outline-primary'}
            onClick={() => setViewMode('list')}
          >
            <ListIcon />
          </Button>
        </div>
      </div>
      
      {isLoading ? (
        <Loader />
      ) : error ? (
        <ErrorMessage message={error} />
      ) : filteredEquipment.length === 0 ? (
        <EmptyState
          icon={<ToolIcon size={48} />}
          title="No equipment found"
          description="Try changing your search or filter criteria, or add new equipment."
          action={
            <Button variant="primary" onClick={() => setShowNewEquipmentModal(true)}>
              <PlusIcon /> Add Equipment
            </Button>
          }
        />
      ) : viewMode === 'card' ? (
        <div className="equipment-grid">
          {filteredEquipment.map(item => (
            <EquipmentCard 
              key={item.id} 
              equipment={item} 
              onManage={() => handleManageEquipment(item)}
            />
          ))}
        </div>
      ) : (
        <div className="equipment-table">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Model</th>
                <th>Serial Number</th>
                <th>Category</th>
                <th>Location</th>
                <th>Status</th>
                <th>Last Service</th>
                <th>Next Service</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEquipment.map(item => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{item.model}</td>
                  <td>{item.serialNumber}</td>
                  <td>{item.category}</td>
                  <td>{item.location}</td>
                  <td>
                    <Badge variant={
                      item.status === 'operational' ? 'success' :
                      item.status === 'maintenance' ? 'warning' :
                      'danger'
                    }>
                      {item.status}
                    </Badge>
                  </td>
                  <td>{formatDate(item.lastService)}</td>
                  <td>
                    <span className={isServiceOverdue(item.nextService) ? 'text-danger' : ''}>
                      {formatDate(item.nextService)}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <Button variant="icon" onClick={() => handleViewEquipment(item)}>
                        <EyeIcon />
                      </Button>
                      <Button variant="icon" onClick={() => handleEditEquipment(item)}>
                        <EditIcon />
                      </Button>
                      <Button variant="icon" onClick={() => handleManageEquipment(item)}>
                        <SettingsIcon />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Equipment modals */}
      {showNewEquipmentModal && (
        <EquipmentModal
          isOpen={showNewEquipmentModal}
          onClose={() => setShowNewEquipmentModal(false)}
          onSubmit={handleCreateEquipment}
          title="Add New Equipment"
        />
      )}
      
      {editingEquipment && (
        <EquipmentModal
          isOpen={!!editingEquipment}
          onClose={() => setEditingEquipment(null)}
          onSubmit={(data) => handleUpdateEquipment(editingEquipment.id, data)}
          title="Edit Equipment"
          initialData={editingEquipment}
        />
      )}
      
      {viewingEquipment && (
        <EquipmentDetailModal
          isOpen={!!viewingEquipment}
          onClose={() => setViewingEquipment(null)}
          equipment={viewingEquipment}
          onEdit={() => {
            setEditingEquipment(viewingEquipment);
            setViewingEquipment(null);
          }}
          onManage={() => {
            handleManageEquipment(viewingEquipment);
            setViewingEquipment(null);
          }}
        />
      )}
      
      {managingEquipment && (
        <EquipmentManagementModal
          isOpen={!!managingEquipment}
          onClose={() => setManagingEquipment(null)}
          equipment={managingEquipment}
          onCreateTask={(taskData) => {
            handleCreateTask({
              ...taskData,
              equipmentId: managingEquipment.id,
              equipment: managingEquipment.name
            });
          }}
          onLogService={handleLogService}
        />
      )}
    </div>
  );
}

// Equipment card component
function EquipmentCard({ equipment, onManage }) {
  const isOverdue = isServiceOverdue(equipment.nextService);
  
  return (
    <Card className={`equipment-card ${isOverdue ? 'service-overdue' : ''}`}>
      <Card.Header>
        <div className="d-flex justify-content-between align-items-center">
          <h3>{equipment.name}</h3>
          <Badge variant={
            equipment.status === 'operational' ? 'success' :
            equipment.status === 'maintenance' ? 'warning' :
            'danger'
          }>
            {equipment.status}
          </Badge>
        </div>
      </Card.Header>
      <Card.Body>
        <div className="equipment-details">
          <div className="detail-item">
            <span className="label">Model:</span>
            <span className="value">{equipment.model}</span>
          </div>
          <div className="detail-item">
            <span className="label">Serial Number:</span>
            <span className="value">{equipment.serialNumber}</span>
          </div>
          <div className="detail-item">
            <span className="label">Category:</span>
            <span className="value">{equipment.category}</span>
          </div>
          <div className="detail-item">
            <span className="label">Location:</span>
            <span className="value">{equipment.location}</span>
          </div>
          <div className="detail-item">
            <span className="label">Runtime:</span>
            <span className="value">{equipment.runtime} hrs</span>
          </div>
          <div className="detail-item">
            <span className="label">Last Service:</span>
            <span className="value">{formatDate(equipment.lastService)}</span>
          </div>
          <div className="detail-item">
            <span className="label">Next Service:</span>
            <span className={`value ${isOverdue ? 'text-danger' : ''}`}>
              {formatDate(equipment.nextService)}
              {isOverdue && <AlertCircleIcon className="ml-2" />}
            </span>
          </div>
        </div>
      </Card.Body>
      <Card.Footer>
        <div className="d-flex justify-content-between">
          <Button variant="outline-primary" onClick={() => onView(equipment)}>
            <EyeIcon /> View
          </Button>
          <Button variant="primary" onClick={() => onManage(equipment)}>
            <SettingsIcon /> Manage
          </Button>
        </div>
      </Card.Footer>
    </Card>
  );
}
```

### Inventory Improvements
```javascript
// Implement improved inventory management
function InventoryPage() {
  const { inventory, isLoading, error, fetchInventory } = useInventory();
  const [viewMode, setViewMode] = useState('card');
  const [filterCategory, setFilterCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  
  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);
  
  // Filter inventory
  const filteredInventory = inventory.filter(item => {
    // Category filter
    if (filterCategory !== 'all' && item.category !== filterCategory) {
      return false;
    }
    
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        item.name.toLowerCase().includes(searchLower) ||
        item.description.toLowerCase().includes(searchLower) ||
        item.supplier.toLowerCase().includes(searchLower)
      );
    }
    
    return true;
  });
  
  // Sort inventory
  const sortedInventory = [...filteredInventory].sort((a, b) => {
    let comparison = 0;
    
    if (sortField === 'name') {
      comparison = a.name.localeCompare(b.name);
    } else if (sortField === 'stockLevel') {
      comparison = a.currentStock - b.currentStock;
    } else if (sortField === 'category') {
      comparison = a.category.localeCompare(b.category);
    } else if (sortField === 'lastRestocked') {
      comparison = new Date(a.lastRestocked) - new Date(b.lastRestocked);
    }
    
    return sortDirection === 'asc' ? comparison : -comparison;
  });
  
  // Get unique categories
  const categories = ['all', ...new Set(inventory.map(item => item.category))];
  
  // Check if stock is low
  const isStockLow = (item) => {
    return item.currentStock <= item.minStockLevel;
  };
  
  return (
    <div className="inventory-page">
      <div className="page-header">
        <h1>Inventory</h1>
        <div className="page-actions">
          <Button variant="primary" onClick={() => setShowNewItemModal(true)}>
            <PlusIcon /> Add Item
          </Button>
        </div>
      </div>
      
      <div className="filter-bar">
        <div className="search-box">
          <SearchIcon />
          <input
            type="text"
            placeholder="Search inventory..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="clear-search" onClick={() => setSearchTerm('')}>
              <XIcon />
            </button>
          )}
        </div>
        
        <div className="category-filter">
          {categories.map(category => (
            <Button
              key={category}
              variant={filterCategory === category ? 'primary' : 'outline-primary'}
              onClick={() => setFilterCategory(category)}
            >
              {category === 'all' ? 'All Items' : category}
            </Button>
          ))}
        </div>
        
        <div className="view-toggle">
          <Button 
            variant={viewMode === 'card' ? 'primary' : 'outline-primary'}
            onClick={() => setViewMode('card')}
          >
            <GridIcon />
          </Button>
          <Button 
            variant={viewMode === 'list' ? 'primary' : 'outline-primary'}
            onClick={() => setViewMode('list')}
          >
            <ListIcon />
          </Button>
        </div>
      </div>
      
      {isLoading ? (
        <Loader />
      ) : error ? (
        <ErrorMessage message={error} />
      ) : sortedInventory.length === 0 ? (
        <EmptyState
          icon={<PackageIcon size={48} />}
          title="No inventory items found"
          description="Try changing your search or filter criteria, or add new items."
          action={
            <Button variant="primary" onClick={() => setShowNewItemModal(true)}>
              <PlusIcon /> Add Item
            </Button>
          }
        />
      ) : viewMode === 'card' ? (
        <div className="inventory-grid">
          {sortedInventory.map(item => (
            <InventoryCard 
              key={item.id} 
              item={item} 
              onRestock={() => handleRestockItem(item)}
              onEdit={() => handleEditItem(item)}
            />
          ))}
        </div>
      ) : (
        <div className="inventory-table">
          <table>
            <thead>
              <tr>
                <th onClick={() => handleSort('name')}>
                  Name
                  {sortField === 'name' && (
                    sortDirection === 'asc' ? <ChevronUpIcon /> : <ChevronDownIcon />
                  )}
                </th>
                <th onClick={() => handleSort('category')}>
                  Category
                  {sortField === 'category' && (
                    sortDirection === 'asc' ? <ChevronUpIcon /> : <ChevronDownIcon />
                  )}
                </th>
                <th onClick={() => handleSort('stockLevel')}>
                  Stock Level
                  {sortField === 'stockLevel' && (
                    sortDirection === 'asc' ? <ChevronUpIcon /> : <ChevronDownIcon />
                  )}
                </th>
                <th>Min. Stock</th>
                <th>Reorder Point</th>
                <th>Supplier</th>
                <th onClick={() => handleSort('lastRestocked')}>
                  Last Restocked
                  {sortField === 'lastRestocked' && (
                    sortDirection === 'asc' ? <ChevronUpIcon /> : <ChevronDownIcon />
                  )}
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedInventory.map(item => (
                <tr key={item.id} className={isStockLow(item) ? 'low-stock' : ''}>
                  <td>{item.name}</td>
                  <td>{item.category}</td>
                  <td>
                    <div className="stock-level">
                      <div className="stock-bar">
                        <div 
                          className="stock-fill" 
                          style={{ 
                            width: `${Math.min(100, (item.currentStock / item.maxStockLevel) * 100)}%`,
                            backgroundColor: isStockLow(item) ? '#dc3545' : '#28a745'
                          }}
                        ></div>
                      </div>
                      <span>{item.currentStock} {item.unit}</span>
                    </div>
                  </td>
                  <td>{item.minStockLevel} {item.unit}</td>
                  <td>{item.reorderPoint} {item.unit}</td>
                  <td>{item.supplier}</td>
                  <td>{formatDate(item.lastRestocked)}</td>
                  <td>
                    <div className="action-buttons">
                      <Button variant="icon" onClick={() => handleViewItem(item)}>
                        <EyeIcon />
                      </Button>
                      <Button variant="icon" onClick={() => handleEditItem(item)}>
                        <EditIcon />
                      </Button>
                      <Button 
                        variant="icon" 
                        onClick={() => handleRestockItem(item)}
                        disabled={item.currentStock >= item.maxStockLevel}
                      >
                        <RefreshCwIcon />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Inventory modals */}
      {showNewItemModal && (
        <InventoryItemModal
          isOpen={showNewItemModal}
          onClose={() => setShowNewItemModal(false)}
          onSubmit={handleCreateItem}
          title="Add New Inventory Item"
        />
      )}
      
      {editingItem && (
        <InventoryItemModal
          isOpen={!!editingItem}
          onClose={() => setEditingItem(null)}
          onSubmit={(data) => handleUpdateItem(editingItem.id, data)}
          title="Edit Inventory Item"
          initialData={editingItem}
        />
      )}
      
      {viewingItem && (
        <InventoryItemDetailModal
          isOpen={!!viewingItem}
          onClose={() => setViewingItem(null)}
          item={viewingItem}
          onEdit={() => {
            setEditingItem(viewingItem);
            setViewingItem(null);
          }}
          onRestock={() => {
            handleRestockItem(viewingItem);
            setViewingItem(null);
          }}
        />
      )}
      
      {restockingItem && (
        <RestockModal
          isOpen={!!restockingItem}
          onClose={() => setRestockingItem(null)}
          item={restockingItem}
          onRestock={handleRestockSubmit}
        />
      )}
    </div>
  );
}

// Inventory card component
function InventoryCard({ item, onRestock, onEdit }) {
  const isLowStock = item.currentStock <= item.minStockLevel;
  const stockPercentage = Math.min(100, (item.currentStock / item.maxStockLevel) * 100);
  
  return (
    <Card className={`inventory-card ${isLowStock ? 'low-stock' : ''}`}>
      <Card.Header>
        <div className="d-flex justify-content-between align-items-center">
          <h3>{item.name}</h3>
          <Badge variant={isLowStock ? 'danger' : 'success'}>
            {isLowStock ? 'Low Stock' : 'Good Stock'}
          </Badge>
        </div>
      </Card.Header>
      <Card.Body>
        <div className="inventory-details">
          <div className="detail-item">
            <span className="label">Category:</span>
            <span className="value">{item.category}</span>
          </div>
          <div className="detail-item">
            <span className="label">Supplier:</span>
            <span className="value">{item.supplier}</span>
          </div>
          <div className="detail-item">
            <span className="label">Stock Level:</span>
            <div className="stock-level">
              <div className="stock-bar">
                <div 
                  className="stock-fill" 
                  style={{ 
                    width: `${stockPercentage}%`,
                    backgroundColor: isLowStock ? '#dc3545' : '#28a745'
                  }}
                ></div>
              </div>
              <span>{item.currentStock} / {item.maxStockLevel} {item.unit}</span>
            </div>
          </div>
          <div className="detail-item">
            <span className="label">Min. Stock:</span>
            <span className="value">{item.minStockLevel} {item.unit}</span>
          </div>
          <div className="detail-item">
            <span className="label">Reorder Point:</span>
            <span className="value">{item.reorderPoint} {item.unit}</span>
          </div>
          <div className="detail-item">
            <span className="label">Last Restocked:</span>
            <span className="value">{formatDate(item.lastRestocked)}</span>
          </div>
        </div>
      </Card.Body>
      <Card.Footer>
        <div className="d-flex justify-content-between">
          <Button variant="outline-primary" onClick={() => onEdit(item)}>
            <EditIcon /> Edit
          </Button>
          <Button 
            variant="primary" 
            onClick={() => onRestock(item)}
            disabled={item.currentStock >= item.maxStockLevel}
          >
            <RefreshCwIcon /> Restock
          </Button>
        </div>
      </Card.Footer>
    </Card>
  );
}
```

## Performance Optimizations

### Code Splitting
```javascript
// Implement code splitting for better performance
import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Loader from './components/common/Loader';

// Lazy load components
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Tasks = lazy(() => import('./pages/Tasks'));
const Equipment = lazy(() => import('./pages/Equipment'));
const Inventory = lazy(() => import('./pages/Inventory'));
const PredictiveMaintenance = lazy(() => import('./pages/PredictiveMaintenance'));
const ISMManagement = lazy(() => import('./pages/ISMManagement'));
const CrewManagement = lazy(() => import('./pages/CrewManagement'));
const FinancialManagement = lazy(() => import('./pages/FinancialManagement'));
const Reports = lazy(() => import('./pages/Reports'));
const Calendar = lazy(() => import('./pages/Calendar'));

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Suspense fallback={<Loader />}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/equipment" element={<Equipment />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/predictive-maintenance" element={<PredictiveMaintenance />} />
            <Route path="/ism-management" element={<ISMManagement />} />
            <Route path="/crew-management" element={<CrewManagement />} />
            <Route path="/financial-management" element={<FinancialManagement />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </Layout>
    </BrowserRouter>
  );
}
```

### Memoization
```javascript
// Use memoization to prevent unnecessary re-renders
import { useMemo, memo } from 'react';

// Memoize expensive calculations
function TasksPage() {
  const { tasks } = useTasks();
  const [filterStatus, setFilterStatus] = useState('all');
  
  // Memoize filtered tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      if (filterStatus === 'all') return true;
      return task.status === filterStatus;
    });
  }, [tasks, filterStatus]);
  
  return (
    <div>
      {/* Component content */}
    </div>
  );
}

// Memoize components
const TaskCard = memo(function TaskCard({ task, onStatusChange }) {
  return (
    <Card>
      {/* Card content */}
    </Card>
  );
});
```

### Virtualization
```javascript
// Implement virtualization for long lists
import { FixedSizeList as List } from 'react-window';

function VirtualizedTaskList({ tasks }) {
  const Row = ({ index, style }) => {
    const task = tasks[index];
    return (
      <div style={style} className="task-row">
        <TaskCard task={task} />
      </div>
    );
  };
  
  return (
    <List
      height={600}
      width="100%"
      itemCount={tasks.length}
      itemSize={150}
    >
      {Row}
    </List>
  );
}
```

## Testing and Quality Assurance

### Unit Testing
```javascript
// Implement unit tests for components and functions
import { render, screen, fireEvent } from '@testing-library/react';
import TaskCard from './TaskCard';

describe('TaskCard', () => {
  const mockTask = {
    id: '1',
    title: 'Test Task',
    description: 'Test Description',
    dueDate: '2025-05-01',
    status: 'upcoming',
    priority: 'High',
    equipment: 'Main Engine',
    assignedTo: 'John Smith'
  };
  
  const mockOnStatusChange = jest.fn();
  
  test('renders task information correctly', () => {
    render(<TaskCard task={mockTask} onStatusChange={mockOnStatusChange} />);
    
    expect(screen.getByText('Test Task')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
    expect(screen.getByText('Due: May 1, 2025')).toBeInTheDocument();
    expect(screen.getByText('High')).toBeInTheDocument();
    expect(screen.getByText('Main Engine')).toBeInTheDocument();
    expect(screen.getByText('John Smith')).toBeInTheDocument();
  });
  
  test('calls onStatusChange when status is changed', () => {
    render(<TaskCard task={mockTask} onStatusChange={mockOnStatusChange} />);
    
    const statusButton = screen.getByText('Mark In Progress');
    fireEvent.click(statusButton);
    
    expect(mockOnStatusChange).toHaveBeenCalledWith('1', 'in-progress');
  });
});
```

### Integration Testing
```javascript
// Implement integration tests for connected components
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TasksProvider } from '../context/TasksContext';
import TasksPage from './TasksPage';

// Mock API
jest.mock('../api', () => ({
  taskService: {
    getTasks: jest.fn(() => Promise.resolve({ data: [
      {
        id: '1',
        title: 'Test Task',
        description: 'Test Description',
        dueDate: '2025-05-01',
        status: 'upcoming',
        priority: 'High',
        equipment: 'Main Engine',
        assignedTo: 'John Smith'
      }
    ]})),
    updateTask: jest.fn(() => Promise.resolve({ data: {} }))
  }
}));

describe('TasksPage', () => {
  test('loads and displays tasks', async () => {
    render(
      <TasksProvider>
        <TasksPage />
      </TasksProvider>
    );
    
    // Check loading state
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    
    // Wait for tasks to load
    await waitFor(() => {
      expect(screen.getByText('Test Task')).toBeInTheDocument();
    });
  });
  
  test('filters tasks correctly', async () => {
    render(
      <TasksProvider>
        <TasksPage />
      </TasksProvider>
    );
    
    // Wait for tasks to load
    await waitFor(() => {
      expect(screen.getByText('Test Task')).toBeInTheDocument();
    });
    
    // Click on filter button
    fireEvent.click(screen.getByText('Due'));
    
    // Task should not be visible (it's upcoming, not due)
    expect(screen.queryByText('Test Task')).not.toBeInTheDocument();
    
    // Click on all tasks button
    fireEvent.click(screen.getByText('All Tasks'));
    
    // Task should be visible again
    expect(screen.getByText('Test Task')).toBeInTheDocument();
  });
});
```

## Deployment Considerations

### Build Optimization
```javascript
// webpack.config.js
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].[contenthash].js',
    publicPath: '/'
  },
  optimization: {
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: true,
          },
        },
      }),
      new CssMinimizerPlugin(),
    ],
    splitChunks: {
      chunks: 'all',
      name: false,
    },
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react'],
            plugins: ['@babel/plugin-transform-runtime']
          }
        }
      },
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
          'postcss-loader'
        ]
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: 'asset/resource',
      },
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html',
      minify: {
        removeComments: true,
        collapseWhitespace: true,
        removeRedundantAttributes: true,
        useShortDoctype: true,
        removeEmptyAttributes: true,
        removeStyleLinkTypeAttributes: true,
        keepClosingSlash: true,
        minifyJS: true,
        minifyCSS: true,
        minifyURLs: true,
      },
    }),
    new MiniCssExtractPlugin({
      filename: '[name].[contenthash].css',
    }),
    process.env.ANALYZE && new BundleAnalyzerPlugin(),
  ].filter(Boolean),
};
```

### Environment Configuration
```javascript
// .env.development
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_DEBUG=true

// .env.production
REACT_APP_API_URL=/api
REACT_APP_DEBUG=false

// src/config.js
const config = {
  apiUrl: process.env.REACT_APP_API_URL,
  debug: process.env.REACT_APP_DEBUG === 'true',
  version: process.env.REACT_APP_VERSION || '1.0.0',
  environment: process.env.NODE_ENV
};

export default config;
```

## Conclusion
This comprehensive improvement prompt provides detailed guidance for enhancing the Eastwind Yacht Management application in Replit. By implementing these improvements, you'll create a more robust, user-friendly, and efficient application that better serves the needs of yacht management professionals.

The improvements focus on:
1. Enhancing code structure and organization
2. Implementing consistent state management
3. Improving UI/UX with a design system
4. Adding responsive layouts
5. Enhancing section-specific functionality
6. Optimizing performance
7. Ensuring quality through testing

Follow this prompt systematically, starting with the core structure improvements and then moving to section-specific enhancements. Test thoroughly after each major change to ensure stability and functionality.
