import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Search,
  Filter,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Wallet,
  Car,
  Plus,
  Minus,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import { useLanguage } from "@/lib/languageContext";

interface Transaction {
  id: string;
  type: "topup" | "payment" | "saldo_awal" | "saldo_akhir";
  description: string;
  amount: number;
  balance_before?: number;
  balance_after?: number;
  date: Date;
  status: "completed" | "pending" | "failed";
  reference_no?: string;
  booking_id?: string;
  vehicle_name?: string;
}

interface TransactionHistoryProps {
  userId?: string;
}

const TransactionHistory = ({ userId }: TransactionHistoryProps = {}) => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [currentBalance, setCurrentBalance] = useState(0);
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
  const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

  useEffect(() => {
    const fetchTransactionHistory = async () => {
      try {
        setLoading(true);

        // Get current session first
        const { data: sessionData } = await supabase.auth.getSession();
        let currentUserId = userId;

        if (!currentUserId && sessionData?.session?.user?.id) {
          currentUserId = sessionData.session.user.id;
        }

        if (!currentUserId) {
          console.log(
            "TransactionHistory - No user ID available for transaction history fetch",
          );
          setTransactions([]);
          setLoading(false);
          return;
        }

        console.log(
          "TransactionHistory - Fetching for user ID:",
          currentUserId,
        );

        // Query histori_transaksi table
        const { data: historiData, error: historiError } = await supabase
          .from("histori_transaksi")
          .select("*")
          .eq("user_id", currentUserId)
          .order("trans_date", { ascending: false });

        console.log("TransactionHistory - Query result:", historiData);
        console.log("TransactionHistory - Query error:", historiError);

        if (historiError) {
          console.error(
            "TransactionHistory - Error fetching transaction history:",
            historiError,
          );
          throw historiError;
        }

        if (!historiData || historiData.length === 0) {
          console.log("TransactionHistory - No transactions found for user");
          setTransactions([]);
          setLoading(false);
          return;
        }

        // Format the data
        const formattedTransactions = historiData.map((transaction) => ({
          id: transaction.id,
          code_booking: transaction.code_booking || "-",
          jenis_transaksi: transaction.jenis_transaksi || "Unknown",
          keterangan: transaction.keterangan || "Unknown",
          nominal: transaction.nominal || 0,
          saldo_awal: transaction.saldo_awal || 0,
          saldo_akhir: transaction.saldo_akhir || 0,
          trans_date: transaction.trans_date
            ? new Date(transaction.trans_date)
            : new Date(),
          status: transaction.status || "pending",
          payment_method: transaction.payment_method || "-",
          bank_name: transaction.bank_name || "-",
          account_number: transaction.account_number || "-",
          account_holder_received: transaction.account_holder_received || "-",
        }));

        console.log(
          "TransactionHistory - Formatted transactions:",
          formattedTransactions,
        );
        setTransactions(formattedTransactions);
      } catch (error) {
        console.error(
          "TransactionHistory - Error fetching transaction history:",
          error,
        );
        setError("Failed to fetch transaction history");
      } finally {
        setLoading(false);
      }
    };

    fetchTransactionHistory();
  }, [userId]);

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch =
      (transaction.jenis_transaksi || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      (transaction.code_booking || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      (transaction.payment_method || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

    const matchesFilter =
      activeFilter === "all" ||
      (activeFilter === "income" && transaction.nominal > 0) ||
      (activeFilter === "expense" && transaction.nominal < 0) ||
      (activeFilter === "topup" &&
        (transaction.jenis_transaksi || "").toLowerCase().includes("topup")) ||
      (activeFilter === "payment" &&
        (transaction.jenis_transaksi || "").toLowerCase().includes("payment"));

    return matchesSearch && matchesFilter;
  });

  // Calculate pagination for bookings
  const totalPages = Math.ceil(filteredTransactions.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedTransactions = filteredTransactions.slice(
    startIndex,
    endIndex,
  );

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter, searchQuery]);

  const getTransactionIcon = (type: string, amount: number) => {
    // Top-up = pemasukan (icon Plus dengan warna hijau)
    if (type === "topup") {
      return <Plus className="h-4 w-4 text-green-500" />;
    }
    // Payment = pengeluaran (icon Minus dengan warna merah)
    else if (type === "payment") {
      return <Minus className="h-4 w-4 text-red-500" />;
    }
    // Default
    {
      /* else {
      return <Wallet className="h-4 w-4 text-blue-500" />;
    }*/
    }
  };

  const getStatusBadge = (status: string) => {
    const statusLower = status.toLowerCase();
    const statusText = status.charAt(0).toUpperCase() + status.slice(1).toUpperCase();
    
    switch (statusLower) {
      case "confirmed":
        return (
          <Badge className="bg-green-100 text-green-800 border border-green-300">
            {statusText}
          </Badge>
        );
      case "completed":
        return (
          <Badge className="bg-blue-100 text-blue-800 border border-blue-300">
            {statusText}
          </Badge>
        );
      case "ongoing":
        return (
          <Badge className="bg-purple-100 text-purple-800 border border-purple-300">
            {statusText}
          </Badge>
        );
      case "cancelled":
        return (
          <Badge className="bg-red-100 text-red-800 border border-red-300">
            {statusText}
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border border-yellow-300">
            {statusText}
          </Badge>
        );
      case "failed":
        return (
          <Badge className="bg-red-100 text-red-800 border border-red-300">
            DITOLAK
          </Badge>
        );
      default:
        return <Badge variant="outline">{statusText}</Badge>;
    }
  };

  const totalIncome = transactions
    .filter((t) => t.amount > 0 && t.status === "completed")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.amount < 0 && t.status === "completed")
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  return (
    <div className="bg-background p-6 rounded-lg w-full max-w-7xl mx-auto">
      {loading && (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading transaction history...</span>
        </div>
      )}

      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-md mb-6">
          <p>{error}</p>
          <Button
            variant="outline"
            className="mt-2"
            onClick={() => window.location.reload()}
          >
            Try Again
          </Button>
        </div>
      )}

      {!loading && !error && (
        <>
          <Button
            variant="ghost"
            className="mb-4 flex items-center gap-1"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </Button>

          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight mb-2">
              Riwayat Transaksi
            </h1>
            <p className="text-muted-foreground">
              Lihat dan kelola riwayat semua transaksi Anda
            </p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Saldo Saat Ini
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Wallet className="mr-2 h-4 w-4 text-primary" />
                  <span className="text-2xl font-bold">
                    Rp {currentBalance.toLocaleString()}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/*  <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Pemasukan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <TrendingUp className="mr-2 h-4 w-4 text-green-500" />
                  <span className="text-2xl font-bold text-green-600">
                    Rp {totalIncome.toLocaleString()}
                  </span>
                </div>
              </CardContent>
            </Card>*/}

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Pengeluaran
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <TrendingDown className="mr-2 h-4 w-4 text-red-500" />
                  <span className="text-2xl font-bold text-red-600">
                    Rp {totalExpense.toLocaleString()}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Transaksi
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <DollarSign className="mr-2 h-4 w-4 text-blue-500" />
                  <span className="text-2xl font-bold">
                    {transactions.length} Transaksi
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Cari transaksi..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={activeFilter === "all" ? "default" : "outline"}
                onClick={() => setActiveFilter("all")}
                size="sm"
              >
                Semua
              </Button>
              <Button
                variant={activeFilter === "income" ? "default" : "outline"}
                onClick={() => setActiveFilter("income")}
                size="sm"
              >
                Pemasukan
              </Button>
              <Button
                variant={activeFilter === "expense" ? "default" : "outline"}
                onClick={() => setActiveFilter("expense")}
                size="sm"
              >
                Pengeluaran
              </Button>
              <Button
                variant={activeFilter === "topup" ? "default" : "outline"}
                onClick={() => setActiveFilter("topup")}
                size="sm"
              >
                Top-up
              </Button>
              <Button
                variant={activeFilter === "payment" ? "default" : "outline"}
                onClick={() => setActiveFilter("payment")}
                size="sm"
              >
                Pembayaran
              </Button>
            </div>
          </div>

          {/* Transaction Table */}
          <Card>
            <CardHeader>
              <CardTitle>Riwayat Transaksi</CardTitle>
              <CardDescription>
                Menampilkan {filteredTransactions.length} dari{" "}
                {transactions.length} transaksi
                {searchQuery && (
                  <span className="ml-2 font-medium">
                    - Hasil pencarian untuk "{searchQuery}"
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredTransactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchQuery ? (
                    <p>
                      Tidak ada transaksi yang ditemukan untuk "{searchQuery}"
                    </p>
                  ) : (
                    <p>Belum ada riwayat transaksi</p>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tanggal</TableHead>
                        <TableHead>Deskripsi</TableHead>
                        <TableHead>Keterangan</TableHead>
                        <TableHead>Jenis</TableHead>
                        <TableHead className="text-right">Jumlah</TableHead>
                        <TableHead className="text-right">
                          Saldo Sebelum
                        </TableHead>
                        <TableHead className="text-right">
                          Saldo Sesudah
                        </TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Referensi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedTransactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell className="font-medium">
                            {transaction.trans_date.toLocaleString("id-ID", {
                              timeZone: "Asia/Jakarta",
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getTransactionIcon(
                                transaction.jenis_transaksi,
                                transaction.nominal,
                              )}
                              <div>
                                <p className="font-medium">
                                  {transaction.jenis_transaksi}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="text-sm text-muted-foreground">
                                {transaction.keterangan}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {transaction.jenis_transaksi
                                ?.toLowerCase()
                                .includes("topup")
                                ? "Top-up"
                                : transaction.jenis_transaksi
                                      ?.toLowerCase()
                                      .includes("payment")
                                  ? "Pembayaran"
                                  : "Pembayaran"}
                            </Badge>
                          </TableCell>
                          <TableCell
                            className={`text-right font-medium ${
                              transaction.jenis_transaksi
                                ?.toLowerCase()
                                .includes("topup")
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {transaction.jenis_transaksi
                              ?.toLowerCase()
                              .includes("topup")
                              ? `+ Rp ${transaction.nominal.toLocaleString()}`
                              : `- Rp ${Math.abs(transaction.nominal).toLocaleString()}`}
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            {transaction.saldo_awal !== undefined
                              ? `Rp ${transaction.saldo_awal.toLocaleString()}`
                              : "-"}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {transaction.saldo_akhir !== undefined
                              ? `Rp ${transaction.saldo_akhir.toLocaleString()}`
                              : "-"}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(transaction.status)}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {transaction.code_booking || "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
          {/* Pagination Controls */}
          {filteredTransactions.length > 0 && (
            <div className="flex items-center justify-between px-4 py-4 border-t mt-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  Baris per halaman:
                </span>
                <Select
                  value={rowsPerPage.toString()}
                  onValueChange={(value) => {
                    setRowsPerPage(Number(value));
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-[70px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-sm text-gray-600">
                  {startIndex + 1}-
                  {Math.min(endIndex, filteredTransactions.length)} dari{" "}
                  {filteredTransactions.length}
                </span>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                {/* Page Numbers */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <Button
                        key={pageNum}
                        variant={
                          currentPage === pageNum ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className="w-8 h-8 p-0"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TransactionHistory;