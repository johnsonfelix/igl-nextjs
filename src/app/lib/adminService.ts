// import { PrismaClient } from "@prisma/client";

// const prisma = new PrismaClient();

// // --- CREATE Master Entities ---
// export const createSponsor = async (data: {
//   name: string;
//   partnerType: string;
//   logo: string;
//   country: string;
// }) => {
//   return prisma.sponsor.create({
//     data,
//   });
// };

// export const createTicket = async (data: {
//   name: string;
//   logo: string;
//   price: number;
// }) => {
//   return prisma.ticket.create({
//     data,
//   });
// };

// export const createHotel = async (data: {
//   hotelName: string;
//   roomType: string;
//   price: number;
// }) => {
//   return prisma.hotel.create({
//     data,
//   });
// };

// export const createBooth = async (data: {
//   boothName: string;
//   image: string;
//   price: number;
// }) => {
//   return prisma.booth.create({
//     data,
//   });
// };

// // --- LINK Entities to Events ---
// export const linkSponsorToEvent = async (eventId: string, sponsorId: string) => {
//   return prisma.eventSponsor.create({
//     data: {
//       eventId,
//       sponsorId,
//     },
//   });
// };

// export const linkTicketToEvent = async (eventId: string, ticketId: string) => {
//   return prisma.eventTicket.create({
//     data: {
//       eventId,
//       ticketId,
//     },
//   });
// };

// export const linkHotelToEvent = async (eventId: string, hotelId: string) => {
//   return prisma.eventHotel.create({
//     data: {
//       eventId,
//       hotelId,
//     },
//   });
// };

// export const linkBoothToEvent = async (eventId: string, boothId: string) => {
//   return prisma.eventBooth.create({
//     data: {
//       eventId,
//       boothId,
//     },
//   });
// };
