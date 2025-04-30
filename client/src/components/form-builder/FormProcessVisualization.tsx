import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';

export const FormProcessVisualization: React.FC<{ className?: string }> = ({ className }) => {
  // Sections where forms can be used
  const formUseSections = [
    {
      title: 'Tasks',
      description: 'Forms can be attached to tasks for crew members to complete',
      color: 'bg-blue-500'
    },
    {
      title: 'Inspections',
      description: 'Regular safety and equipment inspections use custom forms',
      color: 'bg-green-500'
    },
    {
      title: 'Incidents',
      description: 'Incident reporting and investigation forms',
      color: 'bg-amber-500'
    },
    {
      title: 'Reports',
      description: 'Generate comprehensive reports based on form data',
      color: 'bg-purple-500'
    },
    {
      title: 'Compliance',
      description: 'Forms for regulatory compliance documentation',
      color: 'bg-indigo-500'
    }
  ];

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Form Usage Across Eastwind</CardTitle>
        <CardDescription>
          Forms created here are used throughout the application
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Admin creates forms */}
        <div className="rounded-md border p-4 bg-muted/20">
          <h3 className="text-sm font-medium mb-2">Administration</h3>
          <div className="flex items-center gap-2">
            <div className="w-16 h-16 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
              <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path>
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-medium">Form Designer</h4>
              <p className="text-xs text-muted-foreground">Create and configure form templates with the drag-and-drop builder</p>
            </div>
          </div>
        </div>

        {/* Arrow pointing down */}
        <div className="flex justify-center">
          <div className="rounded-full bg-muted p-1">
            <ArrowRight className="h-6 w-6 rotate-90" />
          </div>
        </div>

        {/* System stores forms */}
        <div className="rounded-md border p-4 bg-muted/20">
          <h3 className="text-sm font-medium mb-2">System Storage</h3>
          <div className="flex items-center gap-2">
            <div className="w-16 h-16 rounded-md bg-blue-500/10 flex items-center justify-center flex-shrink-0">
              <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"></path>
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-medium">Form Repository</h4>
              <p className="text-xs text-muted-foreground">Active forms are stored in the system and made available to authorized users</p>
            </div>
          </div>
        </div>

        {/* Arrow pointing down */}
        <div className="flex justify-center">
          <div className="rounded-full bg-muted p-1">
            <ArrowRight className="h-6 w-6 rotate-90" />
          </div>
        </div>

        {/* Users access forms */}
        <div className="rounded-md border p-4">
          <h3 className="text-sm font-medium mb-2">User Access</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {formUseSections.map((section, index) => (
              <div key={index} className="rounded-md border p-2 bg-white dark:bg-gray-950">
                <div className={`w-full h-1 rounded-t-sm ${section.color} mb-2`}></div>
                <h4 className="text-sm font-medium">{section.title}</h4>
                <p className="text-xs text-muted-foreground line-clamp-2">{section.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Arrow pointing down */}
        <div className="flex justify-center">
          <div className="rounded-full bg-muted p-1">
            <ArrowRight className="h-6 w-6 rotate-90" />
          </div>
        </div>

        {/* Data and analytics */}
        <div className="rounded-md border p-4 bg-muted/20">
          <h3 className="text-sm font-medium mb-2">Data Collection & Analysis</h3>
          <div className="flex items-center gap-2">
            <div className="w-16 h-16 rounded-md bg-green-500/10 flex items-center justify-center flex-shrink-0">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-medium">Data Analytics</h4>
              <p className="text-xs text-muted-foreground">Form responses are stored and analyzed for operational insights and reporting</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};