import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/Tabs';
import { BalanceSheet } from '../components/reports/BalanceSheet';
import { ProfitLoss } from '../components/reports/ProfitLoss';
import { TrialBalance } from '../components/reports/TrialBalance';
import { StockSummary } from '../components/reports/StockSummary';
import { GSTReport } from '../components/reports/GSTReport';
import { SalesReport } from '../components/reports/SalesReport';
import { PurchaseReport } from '../components/reports/PurchaseReport';

const ReportsPage = () => {
    const [activeTab, setActiveTab] = useState('balance-sheet');

    return (
        <div className="p-4 md:p-6">
            <div className="max-w-7xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Reports
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Financial and inventory reports
                    </p>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="mb-6 flex flex-wrap">
                        <TabsTrigger value="balance-sheet">Balance Sheet</TabsTrigger>
                        <TabsTrigger value="profit-loss">Profit & Loss</TabsTrigger>
                        <TabsTrigger value="trial-balance">Trial Balance</TabsTrigger>
                        <TabsTrigger value="stock-summary">Stock Summary</TabsTrigger>
                        <TabsTrigger value="gst">GST Report</TabsTrigger>
                        <TabsTrigger value="sales">Sales Report</TabsTrigger>
                        <TabsTrigger value="purchases">Purchase Report</TabsTrigger>
                    </TabsList>

                    <TabsContent value="balance-sheet">
                        <BalanceSheet />
                    </TabsContent>

                    <TabsContent value="profit-loss">
                        <ProfitLoss />
                    </TabsContent>

                    <TabsContent value="trial-balance">
                        <TrialBalance />
                    </TabsContent>

                    <TabsContent value="stock-summary">
                        <StockSummary />
                    </TabsContent>

                    <TabsContent value="gst">
                        <GSTReport />
                    </TabsContent>

                    <TabsContent value="sales">
                        <SalesReport />
                    </TabsContent>

                    <TabsContent value="purchases">
                        <PurchaseReport />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
};

export default ReportsPage;