import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { CheckCircle, Info, AlertTriangle, XCircle } from "lucide-react";

const ColorSystemDemo = () => {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Color System Demo</CardTitle>
          <CardDescription>
            This page demonstrates the new semantic color system with CSS variables
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Badge Variants */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Badge Variants</h3>
            <div className="flex flex-wrap gap-3">
              <Badge variant="default">Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="destructive">Destructive</Badge>
              <Badge variant="outline">Outline</Badge>
              <Badge variant="success">Success</Badge>
              <Badge variant="warning">Warning</Badge>
              <Badge variant="info">Info</Badge>
            </div>
          </div>

          {/* Alert Variants */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Alert Variants</h3>
            <div className="space-y-4">
              <Alert>
                <AlertTitle>Default Alert</AlertTitle>
                <AlertDescription>
                  This is a default alert with standard styling.
                </AlertDescription>
              </Alert>

              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertTitle>Destructive Alert</AlertTitle>
                <AlertDescription>
                  This is a destructive alert for errors or critical warnings.
                </AlertDescription>
              </Alert>

              <Alert variant="success">
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>Success Alert</AlertTitle>
                <AlertDescription>
                  This is a success alert for positive feedback.
                </AlertDescription>
              </Alert>

              <Alert variant="warning">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Warning Alert</AlertTitle>
                <AlertDescription>
                  This is a warning alert for important notices.
                </AlertDescription>
              </Alert>

              <Alert variant="info">
                <Info className="h-4 w-4" />
                <AlertTitle>Info Alert</AlertTitle>
                <AlertDescription>
                  This is an info alert for general information.
                </AlertDescription>
              </Alert>
            </div>
          </div>

          {/* Color Swatches */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Semantic Colors</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <div className="h-20 bg-primary rounded-lg"></div>
                <p className="text-sm font-medium">Primary</p>
              </div>
              <div className="space-y-2">
                <div className="h-20 bg-secondary rounded-lg"></div>
                <p className="text-sm font-medium">Secondary</p>
              </div>
              <div className="space-y-2">
                <div className="h-20 bg-success rounded-lg"></div>
                <p className="text-sm font-medium">Success</p>
              </div>
              <div className="space-y-2">
                <div className="h-20 bg-warning rounded-lg"></div>
                <p className="text-sm font-medium">Warning</p>
              </div>
              <div className="space-y-2">
                <div className="h-20 bg-info rounded-lg"></div>
                <p className="text-sm font-medium">Info</p>
              </div>
              <div className="space-y-2">
                <div className="h-20 bg-destructive rounded-lg"></div>
                <p className="text-sm font-medium">Destructive</p>
              </div>
            </div>
          </div>

          {/* Utility Classes */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Utility Classes</h3>
            <div className="space-y-2">
              <p className="text-success">Text with success color</p>
              <p className="text-warning">Text with warning color</p>
              <p className="text-info">Text with info color</p>
              <p className="text-destructive">Text with destructive color</p>
            </div>
            <div className="mt-4 flex gap-2">
              <div className="p-4 bg-success/10 border border-success/50 rounded">
                Success background
              </div>
              <div className="p-4 bg-warning/10 border border-warning/50 rounded">
                Warning background
              </div>
              <div className="p-4 bg-info/10 border border-info/50 rounded">
                Info background
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ColorSystemDemo;