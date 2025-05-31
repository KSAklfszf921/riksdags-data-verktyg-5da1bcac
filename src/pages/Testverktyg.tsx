
import React from 'react';
import { PageHeader } from '../components/PageHeader';
import { TestTube } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import CalendarTestRunner from '../components/CalendarTestRunner';
import SpeechAnalysisTestRunner from '../components/SpeechAnalysisTestRunner';
import VoteAnalysisTestRunner from '../components/VoteAnalysisTestRunner';
import DocumentAnalysisTestRunner from '../components/DocumentAnalysisTestRunner';
import MemberAnalysisTestRunner from '../components/MemberAnalysisTestRunner';

const Testverktyg = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PageHeader
          title="Testverktyg"
          description="Centrala verktyg för funktionstestning och felsökning av alla analysverktyg i Riksdagskollen"
          icon={<TestTube className="w-6 h-6 text-white" />}
        />

        <div className="space-y-8">
          {/* Quick Navigation */}
          <Card>
            <CardHeader>
              <CardTitle>Snabbnavigering</CardTitle>
              <CardDescription>
                Hoppa direkt till specifika testverktyg
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <Button asChild variant="outline">
                  <Link to="#calendar-tests">Kalendertester</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="#speech-tests">Anförandetester</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="#vote-tests">Voteringstester</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="#document-tests">Dokumenttester</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="#member-tests">Ledamottester</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Calendar Test Suite */}
          <div id="calendar-tests">
            <Card>
              <CardHeader>
                <CardTitle>Kalendertester</CardTitle>
                <CardDescription>
                  Omfattande testsvit för kalenderfunktionalitet
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CalendarTestRunner />
              </CardContent>
            </Card>
          </div>

          {/* Speech Analysis Tests */}
          <div id="speech-tests">
            <Card>
              <CardHeader>
                <CardTitle>Anförandeanalystester</CardTitle>
                <CardDescription>
                  Tester för anförandesökning och språkanalys
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SpeechAnalysisTestRunner />
              </CardContent>
            </Card>
          </div>

          {/* Vote Analysis Tests */}
          <div id="vote-tests">
            <Card>
              <CardHeader>
                <CardTitle>Voteringsanalystester</CardTitle>
                <CardDescription>
                  Tester för voteringsdata och statistik
                </CardDescription>
              </CardHeader>
              <CardContent>
                <VoteAnalysisTestRunner />
              </CardContent>
            </Card>
          </div>

          {/* Document Analysis Tests */}
          <div id="document-tests">
            <Card>
              <CardHeader>
                <CardTitle>Dokumentanalystester</CardTitle>
                <CardDescription>
                  Tester för dokumentsökning och innehållsanalys
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DocumentAnalysisTestRunner />
              </CardContent>
            </Card>
          </div>

          {/* Member Analysis Tests */}
          <div id="member-tests">
            <Card>
              <CardHeader>
                <CardTitle>Ledamotanalystester</CardTitle>
                <CardDescription>
                  Tester för ledamotdata och partianalys
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MemberAnalysisTestRunner />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Testverktyg;
