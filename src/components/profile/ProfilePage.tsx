import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ArrowLeft,
  User,
  Edit,
  Globe,
  ArrowUp,
  ArrowDown,
  LogOut,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

interface ProfilePageProps {
  userId?: string;
}

const ProfilePage = ({ userId }: ProfilePageProps = {}) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingSaldoHistory, setLoadingSaldoHistory] = useState(true);
  const [saldoHistory, setSaldoHistory] = useState<any[]>([]);
  const [driver, setDriver] = useState<any>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      let driverData = null;
      try {
        setLoading(true);
        setError(null);

        // If no userId is provided, try to get the current user
        if (!userId) {
          const { data: sessionData, error: sessionError } =
            await supabase.auth.getSession();
          if (sessionError) throw sessionError;

          if (!sessionData?.session?.user?.id) {
            throw new Error("No authenticated user found");
          }

          userId = sessionData.session.user.id;
        }

        // Fetch user data from drivers table
        const { data, error: driverError } = await supabase
          .from("drivers")
          .select("*, phone_number")
          .eq("id", userId)
          .single();

        driverData = data;

        if (driverError) {
          // If not found in drivers, try users table
          const { data: userData, error: userError } = await supabase
            .from("users")
            .select("*,phone")
            .eq("id", userId)
            .single();

          if (userError) throw userError;
          setUser(userData);
        } else {
          setUser(driverData);
        }
      } catch (error) {
        console.log("Driver data:", driverData);
        console.error("Error fetching user profile:", error);
        setError("Failed to load user profile");
      } finally {
        setLoading(false);
      }
    };

    const fetchSaldoHistory = async (userId: string) => {
      try {
        setLoadingSaldoHistory(true);

        // Fetch saldo history from payments table
        const { data, error } = await supabase
          .from("payments")
          .select("*")
          .eq("driver_id", userId)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setSaldoHistory(data || []);
      } catch (error) {
        console.error("Error fetching saldo history:", error);
      } finally {
        setLoadingSaldoHistory(false);
      }
    };

    fetchUserProfile();
  }, [userId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
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
    );
  }

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Logout gagal:", error.message);
      return;
    }
    navigate("/");
  };

  return (
    <div className="bg-background p-6 rounded-lg w-full max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <Button
          variant="ghost"
          className="flex items-center gap-1"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </Button>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          Profil Driver
        </h1>
        <p className="text-muted-foreground">
          Lihat dan kelola informasi profil Anda
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="md:col-span-1">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Avatar className="h-24 w-24">
                <AvatarImage
                  src={
                    user?.selfie_url
                      ? user.selfie_url
                      : `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || "default"}`
                  }
                  alt={user?.name || "User Avatar"}
                />
                <AvatarFallback>
                  <User className="h-12 w-12" />
                </AvatarFallback>
              </Avatar>
            </div>
            <CardTitle>{user?.name}</CardTitle>
            <CardDescription>{user?.email}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center">
              <Button variant="outline" className="flex items-center gap-2">
                <Edit className="h-4 w-4" />
                Edit Profil
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Informasi Driver</CardTitle>
            <CardDescription>
              Detail informasi pribadi dan kontak Anda
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  Nama Lengkap
                </h3>
                <p className="text-lg">{user?.name || "Tidak tersedia"}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  Email
                </h3>
                <p className="text-lg">
                  {driver?.email || user?.email || "Tidak tersedia"}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  Nomor Telepon
                </h3>
                <p>{driver?.phone_number || user?.phone || "Tidak tersedia"}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  Nomor SIM
                </h3>
                <p className="text-lg">
                  {user?.license_number || "Tidak tersedia"}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  Saldo Driver
                </h3>
                <p className="text-lg">
                  Rp {(user?.saldo || 0).toLocaleString()}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  Driver Role
                </h3>
                <p className="text-lg">
                  {user?.description || "Driver Perusahaan"}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  Driver ID
                </h3>
                <p className="text-lg">{user?.id_driver ?? "Belum tersedia"}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  Status
                </h3>
                <p className="text-lg">{user?.status || "Aktif"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Riwayat Aktivitas</CardTitle>
          <CardDescription>Aktivitas terbaru pada akun Anda</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border-b pb-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium">Login Terakhir</h3>
                  <p className="text-sm text-muted-foreground">
                    {new Date().toLocaleDateString("id-ID", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            </div>
            <div className="border-b pb-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium">Pembaruan Profil Terakhir</h3>
                  <p className="text-sm text-muted-foreground">
                    {new Date().toLocaleDateString("id-ID", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Riwayat Saldo</CardTitle>
          <CardDescription>Mutasi saldo terbaru pada akun Anda</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingSaldoHistory ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : saldoHistory.length > 0 ? (
            <div className="space-y-4">
              {saldoHistory.map((item, index) => (
                <div key={index} className="border-b pb-4 last:border-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">
                          {item.payment_type || "Pembayaran"}
                        </h3>
                        {item.amount > 0 ? (
                          <span className="inline-flex items-center text-xs font-medium text-green-600 bg-green-100 px-2 py-0.5 rounded">
                            <ArrowUp className="h-3 w-3 mr-1" /> Masuk
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-xs font-medium text-red-600 bg-red-100 px-2 py-0.5 rounded">
                            <ArrowDown className="h-3 w-3 mr-1" /> Keluar
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {item.created_at
                          ? new Date(item.created_at).toLocaleDateString(
                              "id-ID",
                              {
                                weekday: "long",
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )
                          : "Tanggal tidak tersedia"}
                      </p>
                      {item.description && (
                        <p className="text-sm mt-1">{item.description}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-medium ${item.amount > 0 ? "text-green-600" : "text-red-600"}`}
                      >
                        {item.amount > 0 ? "+" : ""}
                        Rp {item.amount.toLocaleString()}
                      </p>
                      {item.booking_id && (
                        <p className="text-xs text-muted-foreground">
                          ID Booking: {item.booking_id}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>Belum ada riwayat saldo</p>
            </div>
          )}
        </CardContent>
        {/*  <Button
          variant="outline"
          className="w-full text-destructive border-destructive"
          onClick={handleSignOut}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>*/}
      </Card>
    </div>
  );
};

export default ProfilePage;
