import { NextRequest, NextResponse } from "next/server";
import { City, State } from "country-state-city";

export function GET(request: NextRequest) {
  const stateCode = request.nextUrl.searchParams.get("state")?.toUpperCase();

  if (!stateCode) {
    const states = State.getStatesOfCountry("IN")
      .map((state) => ({ name: state.name, code: state.isoCode }))
      .sort((a, b) => a.name.localeCompare(b.name));
    return NextResponse.json({ states }, { headers: { "Cache-Control": "public, max-age=86400" } });
  }

  const state = State.getStateByCodeAndCountry(stateCode, "IN");
  if (!state) return NextResponse.json({ error: "Invalid Indian state code" }, { status: 400 });

  const cities = [...new Set(City.getCitiesOfState("IN", stateCode).map((city) => city.name))]
    .sort((a, b) => a.localeCompare(b));
  return NextResponse.json({ state: state.name, cities }, { headers: { "Cache-Control": "public, max-age=86400" } });
}
